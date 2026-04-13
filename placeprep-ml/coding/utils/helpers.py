from __future__ import annotations

import json
from pathlib import Path
from typing import Any


DIFFICULTY_ORDER = {
    "easy": 0,
    "medium": 1,
    "hard": 2,
}

LONG_TIME_THRESHOLD_SECONDS = 1800


def load_json_data(path: Path, default: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    if not path.exists():
        if default is not None:
            return default
        raise FileNotFoundError(f"JSON data file not found: {path}")

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"JSON data file is invalid: {path}") from exc

    if not isinstance(payload, list):
        raise ValueError(f"JSON data file must contain a list: {path}")

    return [item for item in payload if isinstance(item, dict)]


def save_json_data(path: Path, payload: list[dict[str, Any]]) -> None:
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def ensure_parent_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def normalize_topic(value: str) -> str:
    return value.strip().lower().replace("-", "_").replace(" ", "_")


def normalize_difficulty(value: str) -> str:
    return value.strip().lower()
