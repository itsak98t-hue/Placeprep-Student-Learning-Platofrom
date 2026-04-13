from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

from openai import APIConnectionError, APIStatusError, APITimeoutError, OpenAI, OpenAIError

from config.settings import (
    BASE_DIR,
    DEFAULT_GROQ_MODEL,
    GENERATED_DATA_DIR,
    GROQ_API_KEY,
    SEED_DATA_PATH,
    ensure_directories,
)


OUTPUT_PATH = GENERATED_DATA_DIR / "generated_behavioral_data.json"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
REQUEST_TIMEOUT_SECONDS = 45
REQUEST_DELAY_SECONDS = 1.2
DEFAULT_GENERATION_ROUNDS = 1
ALLOWED_LABELS = {"weak", "average", "strong"}

LABEL_SCORE_RULES = {
    "weak": {
        "score_clarity": range(2, 5),
        "score_structure": range(2, 5),
        "score_impact": range(1, 4),
    },
    "average": {
        "score_clarity": range(5, 8),
        "score_structure": range(4, 7),
        "score_impact": range(4, 7),
    },
    "strong": {
        "score_clarity": range(7, 11),
        "score_structure": range(7, 11),
        "score_impact": range(7, 11),
    },
}

SYSTEM_PROMPT = """You generate synthetic behavioral interview training data.

Return STRICT JSON only.
Do not include markdown.
Do not include commentary.
Do not wrap the JSON in code fences.
Do not include any text before or after the JSON.
"""

PROMPT_TEMPLATE = """Generate exactly 3 behavioral interview answer variants for the seed entry below.

Requirements:
- Keep the same behavioral category
- Keep the same question theme and intent
- Make the answers realistic for interview preparation
- Return exactly one weak answer, one average answer, and one strong answer
- Keep all responses in valid JSON only
- Use the same question text and category as the seed
- Each answer must sound natural and be distinct
- missing must be a JSON array of strings

Scoring rules:
- weak: score_clarity 2-4, score_structure 2-4, score_impact 1-3
- average: score_clarity 5-7, score_structure 4-6, score_impact 4-6
- strong: score_clarity 7-10, score_structure 7-10, score_impact 7-10

Output JSON shape:
{{
  "items": [
    {{
      "id": "<string id>",
      "question": "<same question>",
      "category": "<same category>",
      "answer": "<behavioral answer>",
      "label": "weak|average|strong",
      "score_clarity": 0,
      "score_structure": 0,
      "score_impact": 0,
      "missing": ["..."]
    }}
  ]
}}

Seed entry JSON:
{seed_json}
"""


class GenerationError(Exception):
    """Base error for synthetic behavioral data generation."""


def get_client() -> OpenAI:
    if not GROQ_API_KEY:
        raise GenerationError(f"Missing GROQ_API_KEY. Expected .env at {BASE_DIR / '.env'}")

    return OpenAI(
        api_key=GROQ_API_KEY,
        base_url=GROQ_BASE_URL,
        timeout=REQUEST_TIMEOUT_SECONDS,
    )


def load_seed_data() -> list[dict[str, Any]]:
    if not SEED_DATA_PATH.exists():
        raise GenerationError(f"Seed data file not found: {SEED_DATA_PATH}")

    try:
        payload = json.loads(SEED_DATA_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise GenerationError(f"Seed data file is not valid JSON: {SEED_DATA_PATH}") from exc

    if not isinstance(payload, list):
        raise GenerationError("Seed data must be a JSON array.")

    validated: list[dict[str, Any]] = []
    for item in payload:
        if not isinstance(item, dict):
            continue

        question = str(item.get("question", "")).strip()
        category = str(item.get("category", "")).strip()
        if not question or not category:
            continue

        validated.append(
            {
                "id": item.get("id"),
                "question": question,
                "category": category,
                "answer": str(item.get("answer", "")).strip(),
                "label": str(item.get("label", "")).strip().lower(),
                "score_clarity": item.get("score_clarity"),
                "score_structure": item.get("score_structure"),
                "score_impact": item.get("score_impact"),
                "missing": item.get("missing", []),
            }
        )

    if not validated:
        raise GenerationError("No valid seed entries were found in the seed file.")

    return validated


def build_prompt(seed_entry: dict[str, Any], round_index: int) -> str:
    seed_payload = {
        "id": seed_entry.get("id"),
        "question": seed_entry["question"],
        "category": seed_entry["category"],
        "answer": seed_entry.get("answer", ""),
        "label": seed_entry.get("label", ""),
        "score_clarity": seed_entry.get("score_clarity"),
        "score_structure": seed_entry.get("score_structure"),
        "score_impact": seed_entry.get("score_impact"),
        "missing": seed_entry.get("missing", []),
        "generation_round": round_index,
    }
    return PROMPT_TEMPLATE.format(seed_json=json.dumps(seed_payload, indent=2))


def call_groq(client: OpenAI, prompt: str) -> str:
    try:
        response = client.chat.completions.create(
            model=DEFAULT_GROQ_MODEL,
            temperature=0.55,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
    except APITimeoutError as exc:
        raise GenerationError("Groq request timed out.") from exc
    except APIConnectionError as exc:
        raise GenerationError("Groq request could not reach the server.") from exc
    except APIStatusError as exc:
        detail = exc.message or "Unexpected Groq API status."
        raise GenerationError(f"Groq request failed: {detail}") from exc
    except OpenAIError as exc:
        raise GenerationError(f"Groq request failed: {exc}") from exc

    content = response.choices[0].message.content if response.choices else None
    if not isinstance(content, str) or not content.strip():
        raise GenerationError("Groq returned empty content.")

    return content


def parse_response(response_text: str) -> list[dict[str, Any]]:
    try:
        payload = json.loads(response_text)
    except json.JSONDecodeError as exc:
        raise GenerationError("Groq returned invalid JSON.") from exc

    if not isinstance(payload, dict):
        raise GenerationError("Groq response must be a JSON object.")

    items = payload.get("items")
    if not isinstance(items, list):
        raise GenerationError("Groq response must include an 'items' array.")

    validated_items: list[dict[str, Any]] = []
    for raw_item in items:
        if not isinstance(raw_item, dict):
            continue

        validated_items.append(validate_generated_item(raw_item))

    if len(validated_items) != 3:
        raise GenerationError("Groq response must contain exactly 3 valid items.")

    labels = {item["label"] for item in validated_items}
    if labels != ALLOWED_LABELS:
        raise GenerationError("Groq response must contain exactly one weak, one average, and one strong item.")

    return validated_items


def validate_generated_item(item: dict[str, Any]) -> dict[str, Any]:
    validated = {
        "id": str(item.get("id", "")).strip(),
        "question": str(item.get("question", "")).strip(),
        "category": str(item.get("category", "")).strip(),
        "answer": str(item.get("answer", "")).strip(),
        "label": str(item.get("label", "")).strip().lower(),
        "score_clarity": item.get("score_clarity"),
        "score_structure": item.get("score_structure"),
        "score_impact": item.get("score_impact"),
        "missing": item.get("missing", []),
    }

    required_fields = ("id", "question", "category", "answer", "label")
    for field_name in required_fields:
        if not validated[field_name]:
            raise GenerationError(f"Generated item is missing required field: {field_name}")

    if validated["label"] not in ALLOWED_LABELS:
        raise GenerationError(f"Generated item has invalid label: {validated['label']}")

    if not isinstance(validated["missing"], list) or not all(
        isinstance(entry, str) and entry.strip() for entry in validated["missing"]
    ):
        raise GenerationError("Generated item 'missing' must be a list of non-empty strings.")

    for score_name in ("score_clarity", "score_structure", "score_impact"):
        score_value = validated[score_name]
        if not isinstance(score_value, int):
            raise GenerationError(f"Generated item {score_name} must be an integer.")

    score_rules = LABEL_SCORE_RULES[validated["label"]]
    if validated["score_clarity"] not in score_rules["score_clarity"]:
        raise GenerationError("Generated item score_clarity does not match label rules.")
    if validated["score_structure"] not in score_rules["score_structure"]:
        raise GenerationError("Generated item score_structure does not match label rules.")
    if validated["score_impact"] not in score_rules["score_impact"]:
        raise GenerationError("Generated item score_impact does not match label rules.")

    return validated


def save_generated_data(items: list[dict[str, Any]]) -> Path:
    ensure_directories()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(items, indent=2), encoding="utf-8")
    return OUTPUT_PATH


def main() -> None:
    print(f"Loading seed data from: {SEED_DATA_PATH}")
    seed_entries = load_seed_data()
    client = get_client()
    generated_items: list[dict[str, Any]] = []

    for seed_index, seed_entry in enumerate(seed_entries, start=1):
        for round_index in range(1, DEFAULT_GENERATION_ROUNDS + 1):
            prompt = build_prompt(seed_entry, round_index)

            try:
                response_text = call_groq(client, prompt)
                items = parse_response(response_text)
                generated_items.extend(items)
                print(
                    f"Generated {len(items)} items for seed {seed_index}/{len(seed_entries)} "
                    f"category={seed_entry['category']} round={round_index}"
                )
            except GenerationError as exc:
                print(
                    f"Skipping seed {seed_index}/{len(seed_entries)} "
                    f"category={seed_entry['category']} round={round_index}: {exc}"
                )

            time.sleep(REQUEST_DELAY_SECONDS)

    if not generated_items:
        raise GenerationError("No synthetic behavioral items were generated.")

    output_path = save_generated_data(generated_items)
    print(f"Saved {len(generated_items)} generated items to {output_path}")


if __name__ == "__main__":
    main()
