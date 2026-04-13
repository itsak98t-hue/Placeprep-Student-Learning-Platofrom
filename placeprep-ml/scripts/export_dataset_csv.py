from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from config.settings import FINAL_DATASET_CSV_PATH, FINAL_DATASET_JSON_PATH, ensure_directories


def load_json_dataset(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"Input dataset not found: {path}")

    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except json.JSONDecodeError as error:
        raise ValueError(f"Invalid JSON in dataset file: {path}") from error

    if not isinstance(data, list):
        raise ValueError(f"Expected a JSON array in: {path}")

    valid_records: list[dict[str, Any]] = []
    for item in data:
        if isinstance(item, dict):
            valid_records.append(item)

    return valid_records


def flatten_missing_field(value: Any) -> str:
    if isinstance(value, list):
        return ", ".join(str(item) for item in value)
    if value is None:
        return ""
    return str(value)


def build_dataframe(records: list[dict[str, Any]]) -> pd.DataFrame:
    dataframe = pd.DataFrame(records)

    if "missing" in dataframe.columns:
        dataframe["missing"] = dataframe["missing"].apply(flatten_missing_field)

    return dataframe


def export_csv(dataframe: pd.DataFrame, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    dataframe.to_csv(output_path, index=False)
    return output_path


def main() -> None:
    ensure_directories()
    records = load_json_dataset(FINAL_DATASET_JSON_PATH)
    dataframe = build_dataframe(records)
    saved_path = export_csv(dataframe, FINAL_DATASET_CSV_PATH)

    print(f"Exported CSV to: {saved_path}")
    print(f"Record count: {len(dataframe)}")


if __name__ == "__main__":
    main()
