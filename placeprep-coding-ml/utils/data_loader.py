from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
QUESTIONS_PATH = DATA_DIR / "questions.json"
COMPANY_TOPIC_WEIGHTS_PATH = DATA_DIR / "company_topic_weights.json"
ATTEMPTS_PATH = DATA_DIR / "sample_user_attempts.json"


def normalize_topic(value: str) -> str:
    """Normalize topic labels to a stable storage and lookup format."""
    return value.strip().lower().replace("-", "_").replace(" ", "_")


def normalize_company(value: str | None) -> str:
    """Normalize company labels for case-insensitive matching."""
    return (value or "").strip().lower()


def load_json(path: Path, default: Any) -> Any:
    """Load JSON safely and return the provided default on missing files."""
    if not path.exists():
        return default

    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON data in {path}") from exc


def save_json(path: Path, payload: Any) -> None:
    """Persist JSON atomically so local prototype writes stay Windows-friendly."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(f"{path.suffix}.tmp")
    temp_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(temp_path, path)


def load_questions() -> list[dict[str, Any]]:
    """Return the coding question metadata bank."""
    payload = load_json(QUESTIONS_PATH, [])
    return [item for item in payload if isinstance(item, dict)]


def load_attempts() -> list[dict[str, Any]]:
    """Return the local prototype attempt history."""
    payload = load_json(ATTEMPTS_PATH, [])
    return [item for item in payload if isinstance(item, dict)]


def load_company_topic_weights() -> dict[str, dict[str, float]]:
    """Load company topic preferences with normalized topic keys."""
    payload = load_json(COMPANY_TOPIC_WEIGHTS_PATH, {})
    normalized: dict[str, dict[str, float]] = {}

    if not isinstance(payload, dict):
        return normalized

    for company_name, topic_weights in payload.items():
        if not isinstance(company_name, str) or not isinstance(topic_weights, dict):
            continue

        normalized_topic_weights: dict[str, float] = {}
        for topic_name, weight in topic_weights.items():
            if isinstance(topic_name, str) and isinstance(weight, (int, float)):
                normalized_topic_weights[normalize_topic(topic_name)] = float(weight)

        normalized[company_name] = normalized_topic_weights

    return normalized


def get_question_lookup(questions: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Build a fast id-to-question lookup."""
    return {
        str(question.get("id")): question
        for question in questions
        if isinstance(question.get("id"), str)
    }


def append_attempt(attempt_record: dict[str, Any]) -> dict[str, Any]:
    """Append a new attempt to the local JSON file and return the stored record."""
    attempts = load_attempts()
    attempts.append(attempt_record)
    save_json(ATTEMPTS_PATH, attempts)
    return attempt_record
