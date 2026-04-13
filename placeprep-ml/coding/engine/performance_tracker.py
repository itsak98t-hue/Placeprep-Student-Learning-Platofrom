from __future__ import annotations

from collections import defaultdict
from pathlib import Path

from coding.models.schemas import DifficultyLevel, PerformanceRecord, PerformanceStatus
from coding.utils.helpers import (
    LONG_TIME_THRESHOLD_SECONDS,
    ensure_parent_dir,
    load_json_data,
    normalize_difficulty,
    normalize_topic,
    save_json_data,
)


STATUS_SCORE_DELTA: dict[PerformanceStatus, int] = {
    "solved": 2,
    "failed": -2,
    "partial": 0,
}


def _validate_record(record: dict) -> PerformanceRecord:
    return PerformanceRecord.model_validate(record)


def _score_record(record: PerformanceRecord) -> int:
    score = STATUS_SCORE_DELTA[record.status]

    if record.hints_used > 0:
        score -= 1

    if record.time_taken_sec >= LONG_TIME_THRESHOLD_SECONDS:
        score -= 1

    return score


def update_user_performance(record: dict, performance_path: Path) -> dict:
    validated = _validate_record(record)
    existing_records = load_json_data(performance_path, default=[])

    stored_record = validated.model_dump(mode="json")
    stored_record["topic"] = normalize_topic(stored_record["topic"])
    stored_record["difficulty"] = normalize_difficulty(stored_record["difficulty"])

    existing_records.append(stored_record)
    ensure_parent_dir(performance_path)
    save_json_data(performance_path, existing_records)
    return stored_record


def compute_topic_scores(user_id: str, performance_path: Path) -> dict[str, int]:
    records = load_json_data(performance_path, default=[])
    topic_scores: dict[str, int] = defaultdict(int)

    for raw_record in records:
        record = _validate_record(raw_record)
        if record.user_id != user_id:
            continue

        topic_scores[normalize_topic(record.topic)] += _score_record(record)

    return dict(sorted(topic_scores.items(), key=lambda item: item[0]))


def get_weak_topics(user_id: str, performance_path: Path) -> list[str]:
    topic_scores = compute_topic_scores(user_id, performance_path)
    ranked_topics = sorted(topic_scores.items(), key=lambda item: item[1])
    return [topic for topic, score in ranked_topics if score < 0]


def get_recent_records_for_topic(user_id: str, topic: str, performance_path: Path) -> list[PerformanceRecord]:
    normalized_topic = normalize_topic(topic)
    records = load_json_data(performance_path, default=[])
    matched: list[PerformanceRecord] = []

    for raw_record in records:
        record = _validate_record(raw_record)
        if record.user_id == user_id and normalize_topic(record.topic) == normalized_topic:
            matched.append(record)

    return matched


def recommend_difficulty_for_topic(
    user_id: str,
    topic: str,
    performance_path: Path,
    fallback: DifficultyLevel = "medium",
) -> DifficultyLevel:
    recent_records = get_recent_records_for_topic(user_id, topic, performance_path)
    if not recent_records:
        return fallback

    recent_records = recent_records[-3:]
    recent_score = sum(_score_record(record) for record in recent_records)

    if recent_score <= -2:
        return "easy"

    solved_hard = any(record.status == "solved" and record.difficulty == "hard" for record in recent_records)
    solved_medium = any(record.status == "solved" and record.difficulty == "medium" for record in recent_records)

    if solved_hard:
        return "hard"
    if recent_score >= 3 and solved_medium:
        return "hard"
    if recent_score >= 2:
        return "medium"

    return "easy"
