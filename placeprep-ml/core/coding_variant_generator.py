from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from openai import APIConnectionError, APIStatusError, APITimeoutError, OpenAI, OpenAIError

from config.settings import DEFAULT_GROQ_MODEL, GROQ_API_KEY
from core.coding_prompt_templates import SYSTEM_PROMPT, build_variant_generation_prompt
from schemas.coding_generation import (
    CodingGenerateVariantsRequest,
    CodingVariantsPayload,
    DIFFICULTY_NAME_TO_LEVEL,
    GeneratedCodingVariant,
)


DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_TIMEOUT_SECONDS = 45
GENERATED_OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data" / "coding_generated"
MIN_DISTINCTIVE_STATEMENT_WORDS = 12


class CodingVariantGenerationError(Exception):
    """Base error for coding variant generation problems."""


class MissingGroqApiKeyError(CodingVariantGenerationError):
    """Raised when GROQ_API_KEY is not configured."""


class GroqApiRequestError(CodingVariantGenerationError):
    """Raised when Groq returns an API-level failure."""


class InvalidGroqResponseError(CodingVariantGenerationError):
    """Raised when the model response is missing or malformed."""


class GroqCodingVariantGenerator:
    """Generates coding-only question variants from a seed question using Groq."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str = DEFAULT_GROQ_BASE_URL,
        timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    ) -> None:
        self._api_key = api_key or GROQ_API_KEY
        self._model = model or DEFAULT_GROQ_MODEL
        self._base_url = base_url
        self._timeout_seconds = timeout_seconds
        print(f"Generator sees key: {'FOUND' if self._api_key else 'NOT FOUND'}")

    def generate_variants(self, payload: CodingGenerateVariantsRequest) -> CodingVariantsPayload:
        if not self._api_key:
            raise MissingGroqApiKeyError("Missing GROQ_API_KEY.")

        failure_reasons: list[str] = []
        collected_variants: list[GeneratedCodingVariant] = []

        for attempt in range(2):
            prompt = build_variant_generation_prompt(
                payload.seed_question,
                payload.count,
                strict_retry=attempt == 1,
                failure_reasons=failure_reasons,
            )
            content = self._call_groq_api(prompt)
            raw_payload = self._load_raw_response(content)
            parsed_seed_id = str(raw_payload.get("seed_question_id", "")).strip()

            if parsed_seed_id != payload.seed_question.id:
                failure_reasons = ["Model response seed_question_id did not match the seed question."]
                continue

            raw_variants = raw_payload.get("variants", [])
            if not isinstance(raw_variants, list):
                failure_reasons = ["Model response variants field was not a JSON array."]
                continue

            collected_variants, failure_reasons = self._collect_valid_variants(
                raw_variants=raw_variants,
                seed_topic=payload.seed_question.topic,
                seed_statement=payload.seed_question.statement,
                requested_count=payload.count,
            )

            if self._is_sufficient(collected_variants, payload.count):
                warning = None
                break
        else:
            warning = self._build_warning(payload.count, collected_variants, failure_reasons)

        if not collected_variants:
            raise InvalidGroqResponseError("Groq did not return any validated coding variants.")

        saved_count = 0
        skipped_duplicates_count = 0
        file_paths_used: list[str] = []

        if payload.save_to_bank or payload.save_generated:
            saved_count, skipped_duplicates_count, file_paths_used = self._save_variants(collected_variants)

        validated_payload = CodingVariantsPayload(
            seed_question_id=payload.seed_question.id,
            variants=collected_variants,
            saved_count=saved_count,
            skipped_duplicates_count=skipped_duplicates_count,
            file_paths_used=file_paths_used,
            warning=warning,
        )

        return validated_payload

    def _client(self) -> OpenAI:
        return OpenAI(
            api_key=self._api_key,
            base_url=self._base_url,
            timeout=self._timeout_seconds,
        )

    def _call_groq_api(self, prompt: str) -> str:
        try:
            response = self._client().chat.completions.create(
                model=self._model,
                temperature=0.35,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
            )
        except APITimeoutError as exc:
            raise GroqApiRequestError("Groq API request timed out.") from exc
        except APIConnectionError as exc:
            raise GroqApiRequestError("Groq API request could not reach the server.") from exc
        except APIStatusError as exc:
            message = exc.message or "Groq API returned an unexpected status."
            raise GroqApiRequestError(f"Groq API request failed: {message}") from exc
        except OpenAIError as exc:
            raise GroqApiRequestError(f"Groq API request failed: {exc}") from exc

        content = response.choices[0].message.content if response.choices else None
        if not isinstance(content, str) or not content.strip():
            raise InvalidGroqResponseError("Groq response message content was empty.")

        return content

    def _load_raw_response(self, content: str) -> dict[str, Any]:
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as exc:
            raise InvalidGroqResponseError("Groq returned invalid JSON content.") from exc

        if not isinstance(parsed, dict):
            raise InvalidGroqResponseError("Groq response must be a JSON object.")

        return parsed

    def _collect_valid_variants(
        self,
        *,
        raw_variants: list[Any],
        seed_topic: str,
        seed_statement: str,
        requested_count: int,
    ) -> tuple[list[GeneratedCodingVariant], list[str]]:
        validated: list[GeneratedCodingVariant] = []
        failure_reasons: list[str] = []
        seen_titles: set[str] = set()
        seen_statements: set[str] = set()

        for raw_variant in raw_variants:
            try:
                sanitized_raw = self._sanitize_variant_payload(raw_variant)
                variant = GeneratedCodingVariant.model_validate(sanitized_raw)
                self._validate_variant_quality(variant, seed_topic, seed_statement)

                title_key = variant.title.strip().lower()
                statement_key = self._normalize_text(variant.statement)
                if title_key in seen_titles or statement_key in seen_statements:
                    raise InvalidGroqResponseError("Generated variant was a duplicate.")

                seen_titles.add(title_key)
                seen_statements.add(statement_key)
                validated.append(variant)
            except Exception as exc:
                failure_reasons.append(str(exc))

        if requested_count == 3:
            mix_errors = self._validate_variant_mix(validated)
            if mix_errors:
                failure_reasons.extend(mix_errors)
                validated = self._prioritize_best_mix(validated)

        return validated[:requested_count], self._dedupe_messages(failure_reasons)

    def _sanitize_variant_payload(self, raw_variant: Any) -> dict[str, Any]:
        if not isinstance(raw_variant, dict):
            raise InvalidGroqResponseError("Each generated variant must be a JSON object.")

        examples: list[dict[str, str]] = []
        raw_examples = raw_variant.get("examples", [])
        if isinstance(raw_examples, list):
            for example in raw_examples:
                if not isinstance(example, dict):
                    continue
                input_value = self._clean_optional_string(example.get("input"))
                output_value = self._clean_optional_string(example.get("output"))
                if not input_value or not output_value:
                    continue
                examples.append(
                    {
                        "input": input_value,
                        "output": output_value,
                        "explanation": self._clean_optional_string(example.get("explanation")),
                    }
                )

        return {
            "title": self._clean_required_string(raw_variant.get("title"), "title"),
            "topic": self._clean_required_string(raw_variant.get("topic"), "topic"),
            "difficulty": self._clean_required_string(raw_variant.get("difficulty"), "difficulty"),
            "difficulty_level": raw_variant.get("difficulty_level"),
            "variant_type": self._clean_required_string(raw_variant.get("variant_type"), "variant_type"),
            "statement": self._clean_required_string(raw_variant.get("statement"), "statement"),
            "examples": examples,
            "constraints": self._clean_string_list(raw_variant.get("constraints")),
            "starter_code": {
                "python": self._clean_required_string(
                    (raw_variant.get("starter_code") or {}).get("python")
                    if isinstance(raw_variant.get("starter_code"), dict)
                    else None,
                    "starter_code.python",
                )
            },
            "hints": self._clean_string_list(raw_variant.get("hints")),
            "explanation": self._clean_required_string(raw_variant.get("explanation"), "explanation"),
            "tags": self._clean_string_list(raw_variant.get("tags")),
        }

    def _validate_variant_quality(
        self,
        variant: GeneratedCodingVariant,
        seed_topic: str,
        seed_statement: str,
    ) -> None:
        expected_level = DIFFICULTY_NAME_TO_LEVEL[variant.difficulty]
        if variant.difficulty_level != expected_level:
            raise InvalidGroqResponseError("Generated variant difficulty and difficulty_level did not match.")
        if variant.topic != seed_topic:
            raise InvalidGroqResponseError("Generated variant topic must match the seed coding topic.")
        if len(self._normalize_text(variant.statement).split()) < MIN_DISTINCTIVE_STATEMENT_WORDS:
            raise InvalidGroqResponseError("Generated variant statement is too short or vague.")
        if self._normalize_text(variant.statement) == self._normalize_text(seed_statement):
            raise InvalidGroqResponseError("Generated variant statement must not duplicate the seed question.")
        if len(variant.hints) < 2:
            raise InvalidGroqResponseError("Generated variant must include at least 2 non-empty hints.")
        if not variant.tags:
            raise InvalidGroqResponseError("Generated variant tags must not be empty.")

    def _validate_variant_mix(self, variants: list[GeneratedCodingVariant]) -> list[str]:
        expected = {"easier", "same_pattern", "harder_twist"}
        actual = [variant.variant_type for variant in variants]

        if len(variants) != 3:
            return ["For count=3, exactly 3 validated variants are required."]

        if set(actual) != expected or len(actual) != len(set(actual)):
            return [
                "For count=3, the validated variants must contain exactly one easier, one same_pattern, and one harder_twist."
            ]

        return []

    def _prioritize_best_mix(self, variants: list[GeneratedCodingVariant]) -> list[GeneratedCodingVariant]:
        ordered_types = ["easier", "same_pattern", "harder_twist"]
        chosen: list[GeneratedCodingVariant] = []

        for variant_type in ordered_types:
            match = next((variant for variant in variants if variant.variant_type == variant_type), None)
            if match is not None:
                chosen.append(match)

        return chosen

    def _is_sufficient(self, variants: list[GeneratedCodingVariant], requested_count: int) -> bool:
        if requested_count == 3:
            return not self._validate_variant_mix(variants)
        return len(variants) >= requested_count

    def _build_warning(
        self,
        requested_count: int,
        variants: list[GeneratedCodingVariant],
        failure_reasons: list[str],
    ) -> str:
        base = (
            f"Only {len(variants)} of {requested_count} generated variants passed validation after one retry."
        )
        if not failure_reasons:
            return base

        reason_preview = "; ".join(self._dedupe_messages(failure_reasons)[:3])
        return f"{base} Validation issues included: {reason_preview}"

    def _clean_required_string(self, value: Any, field_name: str) -> str:
        cleaned = self._clean_optional_string(value)
        if not cleaned:
            raise InvalidGroqResponseError(f"Generated variant {field_name} must not be empty.")
        return cleaned

    def _clean_optional_string(self, value: Any) -> str:
        if value is None:
            return ""
        return str(value).strip()

    def _clean_string_list(self, value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if item is not None and str(item).strip()]

    def _normalize_text(self, value: str) -> str:
        return " ".join(value.lower().split())

    def _dedupe_messages(self, messages: list[str]) -> list[str]:
        seen: set[str] = set()
        deduped: list[str] = []

        for message in messages:
            cleaned = message.strip()
            if not cleaned or cleaned in seen:
                continue
            seen.add(cleaned)
            deduped.append(cleaned)

        return deduped

    def _save_variants(self, variants: list[GeneratedCodingVariant]) -> tuple[int, int, list[str]]:
        grouped: dict[tuple[str, int], list[dict[str, Any]]] = {}
        for variant in variants:
            key = (variant.topic, variant.difficulty_level)
            grouped.setdefault(key, []).append(variant.model_dump(mode="json"))

        saved_count = 0
        skipped_duplicates_count = 0
        file_paths_used: list[str] = []

        for (topic, difficulty_level), payload in grouped.items():
            target_dir = GENERATED_OUTPUT_DIR / topic
            target_dir.mkdir(parents=True, exist_ok=True)
            target_file = target_dir / f"{difficulty_level}.json"
            file_paths_used.append(str(target_file))

            existing_payload: list[dict[str, Any]] = []
            if target_file.exists():
                try:
                    existing_data = json.loads(target_file.read_text(encoding="utf-8"))
                    if isinstance(existing_data, list):
                        existing_payload = existing_data
                except json.JSONDecodeError:
                    existing_payload = []

            existing_keys = {
                self._variant_identity(item)
                for item in existing_payload
                if isinstance(item, dict)
            }

            for item in payload:
                identity_key = self._variant_identity(item)
                if identity_key not in existing_keys:
                    existing_payload.append(item)
                    existing_keys.add(identity_key)
                    saved_count += 1
                else:
                    skipped_duplicates_count += 1

            target_file.write_text(json.dumps(existing_payload, indent=2), encoding="utf-8")

        return saved_count, skipped_duplicates_count, file_paths_used

    def _variant_identity(self, item: dict[str, Any]) -> tuple[str, str, str]:
        return (
            self._normalize_text(str(item.get("title", ""))),
            self._normalize_text(str(item.get("statement", ""))),
            self._normalize_text(str(item.get("variant_type", ""))),
        )
