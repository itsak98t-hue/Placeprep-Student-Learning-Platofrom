from __future__ import annotations

import json
import random
import re
import sys
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from config.settings import CLEANED_DATA_DIR, FINAL_DATASET_JSON_PATH, ensure_directories


OUTPUT_PATH = CLEANED_DATA_DIR / "augmented_behavioral_dataset.json"
RANDOM_SEED = 42
MAX_VARIANTS_PER_RECORD = 3
DEFAULT_MISSING = ["no clear improvement provided"]
VALID_LABELS = {"weak", "average", "strong"}

HEDGE_PHRASES = [
    "kind of",
    "basically",
    "to be honest",
    "honestly",
    "sort of",
]

VAGUE_FILLERS = [
    "and overall it went pretty well",
    "so that was helpful for everyone",
    "and that made the situation better",
    "which was important for the team",
]

REPETITIVE_TAILS = [
    "I kept following up and following up until it was done.",
    "I tried to stay clear and clear in how I explained it.",
    "I wanted to keep it simple and simple for the team.",
]


def load_dataset(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"Behavioral dataset not found: {path}")

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Behavioral dataset is not valid JSON: {path}") from exc

    if not isinstance(payload, list):
        raise ValueError(f"Expected a JSON array in: {path}")

    return [item for item in payload if isinstance(item, dict)]


def normalize_text(value: Any) -> str:
    return " ".join(str(value).strip().split())


def normalize_missing(value: Any) -> list[str]:
    if not isinstance(value, list):
        return DEFAULT_MISSING.copy()

    cleaned = sorted(
        {
            normalize_text(item).lower()
            for item in value
            if isinstance(item, str) and normalize_text(item)
        }
    )
    return cleaned or DEFAULT_MISSING.copy()


def validate_record(record: dict[str, Any]) -> dict[str, Any] | None:
    question = normalize_text(record.get("question", ""))
    category = normalize_text(record.get("category", "")).lower().replace("-", "_").replace(" ", "_")
    answer = normalize_text(record.get("answer", ""))
    label = normalize_text(record.get("label", "")).lower()

    if not question or not category or not answer or label not in VALID_LABELS:
        return None

    try:
        score_clarity = int(record.get("score_clarity"))
        score_structure = int(record.get("score_structure"))
        score_impact = int(record.get("score_impact"))
    except (TypeError, ValueError):
        return None

    if not (1 <= score_clarity <= 10 and 1 <= score_structure <= 10 and 1 <= score_impact <= 10):
        return None

    return {
        "id": int(record.get("id", 0) or 0),
        "question": question,
        "category": category,
        "answer": answer,
        "label": label,
        "score_clarity": score_clarity,
        "score_structure": score_structure,
        "score_impact": score_impact,
        "missing": normalize_missing(record.get("missing")),
        "source_group": str(record.get("source_group", "")).strip() or f"{category}::{question.lower()}",
    }


def inject_grammar_mistakes(answer: str, rng: random.Random) -> str:
    updated = answer
    replacements = [
        (r"\bI\b", "i"),
        (r"\bwas\b", "was kinda"),
        (r"\bwere\b", "was"),
        (r"\bdid not\b", "didnt"),
        (r"\bdidn't\b", "didnt"),
    ]

    rng.shuffle(replacements)
    for pattern, replacement in replacements[:2]:
        updated = re.sub(pattern, replacement, updated, count=1)

    updated = updated.replace(", and", " and", 1)
    return normalize_text(updated)


def make_short_but_acceptable(answer: str) -> str:
    sentences = re.split(r"(?<=[.!?])\s+", answer)
    if len(sentences) <= 2:
        return normalize_text(answer)
    return normalize_text(" ".join(sentences[:2]))


def make_long_but_vague(answer: str, rng: random.Random) -> str:
    vague_bits = " ".join(rng.sample(VAGUE_FILLERS, k=2))
    return normalize_text(f"{answer} {vague_bits}")


def make_partial_star(answer: str) -> str:
    sentences = re.split(r"(?<=[.!?])\s+", answer)
    if len(sentences) < 3:
      return normalize_text(answer)
    trimmed = sentences[:-1]
    return normalize_text(" ".join(trimmed))


def remove_measurable_result(answer: str) -> str:
    updated = re.sub(r"\b\d+[%xX]?\b", "", answer)
    updated = re.sub(r"\b(on time|ahead of schedule|by \d+%|within \w+ days)\b", "", updated, flags=re.IGNORECASE)
    return normalize_text(updated)


def add_repetitive_wording(answer: str, rng: random.Random) -> str:
    tail = rng.choice(REPETITIVE_TAILS)
    return normalize_text(f"{answer} {tail}")


def add_hedging(answer: str, rng: random.Random) -> str:
    hedge = rng.choice(HEDGE_PHRASES)
    return normalize_text(f"{hedge}, {answer}")


def clamp_score(value: int) -> int:
    return max(1, min(10, value))


def score_adjustments_for_variant(label: str, variant_type: str) -> tuple[int, int, int]:
    if variant_type == "grammar_mistakes":
        return (-1, 0, 0)
    if variant_type == "short_acceptable":
        return (-1, -1, 0)
    if variant_type == "long_vague":
        return (0, -1, -1)
    if variant_type == "partial_star":
        return (0, -2, -1)
    if variant_type == "missing_result":
        return (0, -1, -2)
    if variant_type == "repetitive":
        return (-1, -1, 0)
    if variant_type == "hedged_boundary":
        if label == "strong":
            return (-1, -1, -1)
        return (-1, 0, -1)
    return (0, 0, 0)


def build_variant(record: dict[str, Any], variant_type: str, answer: str, next_id: int) -> dict[str, Any]:
    delta_clarity, delta_structure, delta_impact = score_adjustments_for_variant(record["label"], variant_type)

    missing = set(record["missing"])
    if variant_type in {"partial_star", "short_acceptable"}:
        missing.add("clear structure")
    if variant_type in {"missing_result", "long_vague"}:
        missing.add("measurable result")
    if variant_type == "repetitive":
        missing.add("concise wording")

    return {
        "id": next_id,
        "question": record["question"],
        "category": record["category"],
        "answer": normalize_text(answer),
        "label": record["label"],
        "score_clarity": clamp_score(record["score_clarity"] + delta_clarity),
        "score_structure": clamp_score(record["score_structure"] + delta_structure),
        "score_impact": clamp_score(record["score_impact"] + delta_impact),
        "missing": sorted(missing) if missing else DEFAULT_MISSING.copy(),
        "source_group": record["source_group"],
    }


def generate_variants_for_record(record: dict[str, Any], next_id_start: int, rng: random.Random) -> list[dict[str, Any]]:
    candidate_builders = [
        ("grammar_mistakes", lambda answer: inject_grammar_mistakes(answer, rng)),
        ("short_acceptable", make_short_but_acceptable),
        ("long_vague", lambda answer: make_long_but_vague(answer, rng)),
        ("partial_star", make_partial_star),
        ("missing_result", remove_measurable_result),
        ("repetitive", lambda answer: add_repetitive_wording(answer, rng)),
        ("hedged_boundary", lambda answer: add_hedging(answer, rng)),
    ]

    chosen = rng.sample(candidate_builders, k=MAX_VARIANTS_PER_RECORD)
    variants: list[dict[str, Any]] = []

    for offset, (variant_type, transformer) in enumerate(chosen):
        transformed_answer = transformer(record["answer"])
        if transformed_answer == record["answer"]:
            continue

        variants.append(
            build_variant(
                record=record,
                variant_type=variant_type,
                answer=transformed_answer,
                next_id=next_id_start + offset,
            )
        )

    return variants


def augment_dataset(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rng = random.Random(RANDOM_SEED)
    validated_records = [validated for item in records if (validated := validate_record(item)) is not None]

    if not validated_records:
        raise ValueError("No valid behavioral records were found for augmentation.")

    max_id = max(record["id"] for record in validated_records)
    next_id = max_id + 1
    augmented_records = validated_records[:]

    for record in validated_records:
        variants = generate_variants_for_record(record, next_id, rng)
        next_id += len(variants)
        augmented_records.extend(variants)

    return augmented_records


def save_augmented_dataset(records: list[dict[str, Any]], path: Path) -> Path:
    ensure_directories()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


def main() -> None:
    records = load_dataset(FINAL_DATASET_JSON_PATH)
    augmented_records = augment_dataset(records)
    output_path = save_augmented_dataset(augmented_records, OUTPUT_PATH)

    print(f"Original record count: {len(records)}")
    print(f"Augmented record count: {len(augmented_records)}")
    print(f"Saved augmented dataset to: {output_path}")


if __name__ == "__main__":
    main()
