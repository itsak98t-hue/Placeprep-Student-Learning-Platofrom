from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from dateutil import parser

from utils.data_loader import normalize_company, normalize_topic


def _safe_parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return parser.isoparse(value)
    except (TypeError, ValueError):
        return None


def _get_recent_attempt_map(
    user_attempts: list[dict[str, Any]],
    recent_days: int,
) -> dict[str, datetime]:
    cutoff = datetime.now().astimezone() - timedelta(days=recent_days)
    recent_attempts: dict[str, datetime] = {}

    for attempt in user_attempts:
        question_id = str(attempt.get("question_id", ""))
        attempted_at = _safe_parse_datetime(attempt.get("attempted_at"))

        if not question_id or attempted_at is None or attempted_at < cutoff:
            continue

        if question_id not in recent_attempts or attempted_at > recent_attempts[question_id]:
            recent_attempts[question_id] = attempted_at

    return recent_attempts


def filter_candidate_questions(
    user_id: str,
    questions: list[dict[str, Any]],
    attempts: list[dict[str, Any]],
    topic_stats: dict[str, dict[str, Any]],
    target_company: str | None = None,
    recent_days: int = 5,
) -> list[dict[str, Any]]:
    """Filter candidates to a sensible practice zone without over-constraining the pool."""
    user_attempts = [attempt for attempt in attempts if attempt.get("user_id") == user_id]
    recent_attempt_map = _get_recent_attempt_map(user_attempts, recent_days)
    preferred_company = normalize_company(target_company)

    filtered: list[dict[str, Any]] = []
    company_aligned: list[dict[str, Any]] = []

    for question in questions:
        question_id = str(question.get("id", ""))
        topic = normalize_topic(str(question.get("topic", "")))
        difficulty = int(question.get("difficulty", 2) or 2)
        prerequisites = [
            normalize_topic(str(item))
            for item in question.get("prerequisites", [])
            if isinstance(item, str)
        ]

        topic_level = int(topic_stats.get(topic, {}).get("inferred_topic_level", 1) or 1)
        difficulty_gap = difficulty - topic_level

        prerequisite_fit = 1.0
        if prerequisites:
            prerequisite_scores = [
                float(topic_stats.get(prerequisite, {}).get("mastery_score", 0.35))
                for prerequisite in prerequisites
            ]
            prerequisite_fit = sum(prerequisite_scores) / len(prerequisite_scores)

        if question_id in recent_attempt_map:
            continue
        if difficulty_gap > 1:
            continue
        if difficulty < max(1, topic_level - 1):
            continue
        if prerequisite_fit < 0.28 and difficulty >= 2:
            continue

        filtered.append(question)

        if preferred_company:
            question_companies = [normalize_company(company) for company in question.get("companies", [])]
            if preferred_company in question_companies:
                company_aligned.append(question)

    if preferred_company and len(company_aligned) >= 4:
        return company_aligned

    return filtered
