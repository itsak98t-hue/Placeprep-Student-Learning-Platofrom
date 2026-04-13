from __future__ import annotations

import json
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from config.settings import (
    CLEANED_DATA_DIR,
    FINAL_DATASET_JSON_PATH,
    GENERATED_DATA_DIR,
    SEED_DATA_PATH,
    ensure_directories,
)

GENERATED_DATA_PATH = GENERATED_DATA_DIR / "generated_behavioral_data.json"
HARDSET_DATA_PATH = ROOT_DIR / "seed_data" / "behavioral_hardset.json"
BOUNDARY_DATA_PATH = ROOT_DIR / "seed_data" / "behavioral_boundary_set.json"

DEFAULT_MISSING_VALUE = ["no clear improvement provided"]
VALID_LABELS = {"weak", "average", "strong"}
SIMILARITY_THRESHOLD = 0.95


def load_json_array(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found: {path}")

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Dataset file is not valid JSON: {path}") from exc

    if not isinstance(payload, list):
        raise ValueError(f"Expected a JSON array in: {path}")

    return [item for item in payload if isinstance(item, dict)]


def load_optional_json_array(path: Path, label: str) -> list[dict[str, Any]]:
    if not path.exists():
        print(f"{label} not found: {path}")
        return []

    records = load_json_array(path)
    print(f"Loaded {label}: {len(records)}")
    return records


def normalize_text(value: Any) -> str:
    return " ".join(str(value).strip().split())


def normalize_category(value: Any) -> str:
    category = normalize_text(value).lower()
    category = category.replace("-", "_").replace(" ", "_")
    category = re.sub(r"_+", "_", category)
    return category.strip("_")


def normalize_missing_field(value: Any) -> tuple[list[str], bool]:
    if not isinstance(value, list):
        return DEFAULT_MISSING_VALUE.copy(), True

    cleaned = [
        normalize_text(item).lower()
        for item in value
        if isinstance(item, str) and normalize_text(item)
    ]
    cleaned = sorted(set(cleaned))

    if not cleaned:
        return DEFAULT_MISSING_VALUE.copy(), True

    return cleaned, False


def validate_and_normalize_record(
    record: dict[str, Any],
    fallback_id: int,
) -> tuple[dict[str, Any] | None, bool]:
    question = normalize_text(record.get("question", ""))
    category = normalize_category(record.get("category", ""))
    answer = normalize_text(record.get("answer", ""))
    label = normalize_text(record.get("label", "")).lower()

    if not question or not category or not answer or label not in VALID_LABELS:
        return None, False

    try:
        score_clarity = int(record.get("score_clarity"))
        score_structure = int(record.get("score_structure"))
        score_impact = int(record.get("score_impact"))
    except (TypeError, ValueError):
        return None, False

    for score in (score_clarity, score_structure, score_impact):
        if score < 1 or score > 10:
            return None, False

    normalized_missing, missing_fixed = normalize_missing_field(record.get("missing"))
    raw_id = normalize_text(record.get("id", ""))
    normalized_id = raw_id if raw_id else str(fallback_id)

    normalized = {
        "id": normalized_id,
        "question": question,
        "category": category,
        "answer": answer,
        "label": label,
        "score_clarity": score_clarity,
        "score_structure": score_structure,
        "score_impact": score_impact,
        "missing": normalized_missing,
    }

    return normalized, missing_fixed


def answer_similarity(left: str, right: str) -> float:
    return SequenceMatcher(None, left.lower(), right.lower()).ratio()


def deduplicate_by_answer_similarity(
    records: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], int]:
    unique_records: list[dict[str, Any]] = []
    duplicates_removed = 0

    for record in records:
        record_answer = record["answer"]
        is_duplicate = False

        for existing in unique_records:
            same_bucket = (
                existing["question"] == record["question"]
                and existing["category"] == record["category"]
                and existing["label"] == record["label"]
            )
            if not same_bucket:
                continue

            if answer_similarity(existing["answer"], record_answer) >= SIMILARITY_THRESHOLD:
                is_duplicate = True
                duplicates_removed += 1
                break

        if not is_duplicate:
            unique_records.append(record)

    return unique_records, duplicates_removed


def reindex_records(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    reindexed: list[dict[str, Any]] = []
    for index, record in enumerate(records, start=1):
        reindexed.append(
            {
                **record,
                "id": index,
            }
        )
    return reindexed


def save_cleaned_dataset(records: list[dict[str, Any]]) -> Path:
    ensure_directories()
    CLEANED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    FINAL_DATASET_JSON_PATH.write_text(
        json.dumps(records, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return FINAL_DATASET_JSON_PATH


def main() -> None:
    seed_records = load_json_array(SEED_DATA_PATH)
    generated_records = load_json_array(GENERATED_DATA_PATH)
    hardset_records = load_optional_json_array(HARDSET_DATA_PATH, "hardset samples")
    boundary_records = load_optional_json_array(BOUNDARY_DATA_PATH, "boundary samples")

    total_seed = len(seed_records)
    total_generated = len(generated_records)
    total_hardset = len(hardset_records)
    total_boundary = len(boundary_records)

    invalid_fixed = 0
    invalid_removed = 0
    normalized_records: list[dict[str, Any]] = []

    all_records = seed_records + generated_records + hardset_records + boundary_records

    for index, record in enumerate(all_records, start=1):
        normalized, missing_fixed = validate_and_normalize_record(record, fallback_id=index)
        if normalized is None:
            invalid_removed += 1
            continue

        if missing_fixed:
            invalid_fixed += 1

        normalized_records.append(normalized)

    deduplicated_records, duplicates_removed = deduplicate_by_answer_similarity(normalized_records)
    final_records = reindex_records(deduplicated_records)
    output_path = save_cleaned_dataset(final_records)

    print(f"total seed: {total_seed}")
    print(f"total generated: {total_generated}")
    print(f"total hardset: {total_hardset}")
    print(f"total boundary: {total_boundary}")
    print(f"duplicates removed: {duplicates_removed}")
    print(f"invalid fixed: {invalid_fixed}")
    print(f"invalid removed: {invalid_removed}")
    print(f"final count: {len(final_records)}")
    print(f"saved to: {output_path}")


if __name__ == "__main__":
    main()