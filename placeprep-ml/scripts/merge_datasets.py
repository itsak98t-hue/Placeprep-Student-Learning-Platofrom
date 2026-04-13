from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from config.settings import GENERATED_DATA_DIR, MERGED_DATASET_PATH, SEED_DATA_PATH, ensure_directories


def load_json_records(path: Path) -> list[dict[str, Any]]:
    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except FileNotFoundError:
        print(f"Skipping missing file: {path}")
        return []
    except json.JSONDecodeError as error:
        print(f"Skipping broken JSON file: {path} ({error})")
        return []
    except OSError as error:
        print(f"Skipping unreadable file: {path} ({error})")
        return []

    if not isinstance(data, list):
        print(f"Skipping file with non-list JSON root: {path}")
        return []

    valid_records: list[dict[str, Any]] = []
    invalid_count = 0

    for item in data:
        if isinstance(item, dict):
            valid_records.append(item)
        else:
            invalid_count += 1

    print(
        f"Loaded {len(valid_records)} valid records from {path.name}"
        + (f" and skipped {invalid_count} invalid items." if invalid_count else ".")
    )
    return valid_records


def get_generated_json_files(directory: Path) -> list[Path]:
    if not directory.exists():
        print(f"Generated data directory not found: {directory}")
        return []

    return sorted(
        path for path in directory.iterdir() if path.is_file() and path.suffix.lower() == ".json"
    )


def merge_datasets(seed_path: Path, generated_files: list[Path]) -> list[dict[str, Any]]:
    merged_records: list[dict[str, Any]] = []

    merged_records.extend(load_json_records(seed_path))

    for file_path in generated_files:
        merged_records.extend(load_json_records(file_path))

    return merged_records


def save_merged_dataset(records: list[dict[str, Any]], output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as file:
        json.dump(records, file, indent=2, ensure_ascii=False)
    return output_path


def main() -> None:
    ensure_directories()

    generated_files = get_generated_json_files(GENERATED_DATA_DIR)
    merged_records = merge_datasets(SEED_DATA_PATH, generated_files)

    save_merged_dataset(merged_records, MERGED_DATASET_PATH)

    print(f"Total merged records: {len(merged_records)}")
    print(f"Merged dataset saved to: {MERGED_DATASET_PATH}")


if __name__ == "__main__":
    main()
