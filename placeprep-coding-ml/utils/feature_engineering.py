from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Any

from dateutil import parser

from utils.data_loader import get_question_lookup, normalize_topic


STATUS_TO_SUCCESS_VALUE = {
    "solved": 1.0,
    "partial": 0.45,
    "failed": 0.0,
    "skipped": 0.0,
}

STATUS_TO_RECENT_VALUE = {
    "solved": 1.0,
    "partial": 0.45,
    "failed": 0.0,
    "skipped": 0.15,
}


def clamp(value: float, lower: float = 0.0, upper: float = 1.0) -> float:
    """Keep numeric features inside a safe range."""
    return max(lower, min(upper, value))


def safe_parse_datetime(value: str | None) -> datetime | None:
    """Parse ISO timestamps defensively."""
    if not value:
        return None

    try:
        return parser.isoparse(value)
    except (TypeError, ValueError):
        return None


def _status_value(status: str) -> float:
    return STATUS_TO_SUCCESS_VALUE.get(status.strip().lower(), 0.0)


def _recent_status_value(status: str) -> float:
    return STATUS_TO_RECENT_VALUE.get(status.strip().lower(), 0.0)


def infer_topic_level(mastery_score: float, avg_attempt_difficulty: float) -> int:
    """Map a soft mastery score to an approximate current topic level."""
    if mastery_score >= 0.74 and avg_attempt_difficulty >= 2.0:
        return 3
    if mastery_score >= 0.42 or avg_attempt_difficulty >= 1.5:
        return 2
    return 1


def compute_topic_stats(
    user_id: str,
    attempts: list[dict[str, Any]],
    questions: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    """Compute per-user per-topic mastery, weakness, and recent struggle signals."""
    question_lookup = get_question_lookup(questions)
    topic_attempts: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for attempt in attempts:
        if attempt.get("user_id") != user_id:
            continue

        topic = normalize_topic(str(attempt.get("topic", "")))
        if topic:
            topic_attempts[topic].append(attempt)

    topic_stats: dict[str, dict[str, Any]] = {}

    for topic, entries in topic_attempts.items():
        attempted = len(entries)
        solved = sum(1 for entry in entries if entry.get("status") == "solved")
        failed = sum(1 for entry in entries if entry.get("status") == "failed")
        partial = sum(1 for entry in entries if entry.get("status") == "partial")
        skipped = sum(1 for entry in entries if entry.get("status") == "skipped")

        success_rate = (
            sum(_status_value(str(entry.get("status", ""))) for entry in entries) / attempted
            if attempted
            else 0.0
        )
        avg_time_spent = (
            sum(float(entry.get("time_spent_min", 0) or 0) for entry in entries) / attempted
            if attempted
            else 0.0
        )
        avg_hints_used = (
            sum(float(entry.get("hints_used", 0) or 0) for entry in entries) / attempted
            if attempted
            else 0.0
        )

        recent_entries = sorted(
            entries,
            key=lambda entry: safe_parse_datetime(entry.get("attempted_at")) or datetime.min,
            reverse=True,
        )[:5]
        recent_fail_rate = (
            sum(1 for entry in recent_entries if entry.get("status") == "failed") / len(recent_entries)
            if recent_entries
            else 0.0
        )
        recent_partial_rate = (
            sum(1 for entry in recent_entries if entry.get("status") == "partial") / len(recent_entries)
            if recent_entries
            else 0.0
        )

        expected_time_values = [
            float(
                question_lookup.get(str(entry.get("question_id", "")), {}).get(
                    "estimated_time_min",
                    entry.get("time_spent_min", 0),
                )
                or entry.get("time_spent_min", 0)
            )
            for entry in entries
        ]
        expected_avg_time = (
            sum(expected_time_values) / len(expected_time_values)
            if expected_time_values
            else max(avg_time_spent, 1.0)
        )
        avg_time_ratio = avg_time_spent / max(expected_avg_time, 1.0)
        speed_score = clamp(1.25 - avg_time_ratio)
        low_hint_score = clamp(1.0 - (avg_hints_used / 3.0))
        recent_performance_score = (
            sum(_recent_status_value(str(entry.get("status", ""))) for entry in recent_entries) / len(recent_entries)
            if recent_entries
            else success_rate
        )

        mastery_score = clamp(
            0.45 * success_rate
            + 0.20 * speed_score
            + 0.15 * low_hint_score
            + 0.20 * recent_performance_score
        )
        weakness_score = clamp(1.0 - mastery_score)

        avg_attempt_difficulty = (
            sum(float(entry.get("difficulty", 1) or 1) for entry in entries) / attempted
            if attempted
            else 1.0
        )

        topic_stats[topic] = {
            "attempted": attempted,
            "solved": solved,
            "failed": failed,
            "partial": partial,
            "skipped": skipped,
            "success_rate": round(success_rate, 4),
            "avg_time_spent": round(avg_time_spent, 2),
            "avg_hints_used": round(avg_hints_used, 2),
            "recent_fail_rate": round(recent_fail_rate, 4),
            "recent_partial_rate": round(recent_partial_rate, 4),
            "mastery_score": round(mastery_score, 4),
            "weakness_score": round(weakness_score, 4),
            "inferred_topic_level": infer_topic_level(mastery_score, avg_attempt_difficulty),
        }

    return topic_stats


def build_user_summary(
    user_id: str,
    attempts: list[dict[str, Any]],
    topic_stats: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    """Create a compact frontend-friendly summary alongside per-topic stats."""
    user_attempts = [attempt for attempt in attempts if attempt.get("user_id") == user_id]
    weakest_topic = None
    strongest_topic = None
    focus_topics: list[str] = []
    recent_struggle_topics: list[str] = []

    if topic_stats:
        weakest_topic = max(topic_stats.items(), key=lambda item: item[1].get("weakness_score", 0.0))[0]
        strongest_topic = max(topic_stats.items(), key=lambda item: item[1].get("mastery_score", 0.0))[0]
        focus_topics = [
            topic
            for topic, _ in sorted(
                topic_stats.items(),
                key=lambda item: (
                    float(item[1].get("weakness_score", 0.0)),
                    float(item[1].get("recent_fail_rate", 0.0)),
                    float(item[1].get("recent_partial_rate", 0.0)),
                ),
                reverse=True,
            )[:3]
        ]
        recent_struggle_topics = [
            topic
            for topic, stats in sorted(
                topic_stats.items(),
                key=lambda item: (
                    float(item[1].get("recent_fail_rate", 0.0)),
                    float(item[1].get("recent_partial_rate", 0.0)),
                ),
                reverse=True,
            )
            if float(stats.get("recent_fail_rate", 0.0)) > 0.0 or float(stats.get("recent_partial_rate", 0.0)) > 0.0
        ][:3]

    total_attempts = len(user_attempts)
    overall_success_rate = (
        sum(_status_value(str(attempt.get("status", ""))) for attempt in user_attempts) / total_attempts
        if total_attempts
        else 0.0
    )
    avg_time_spent = (
        sum(float(attempt.get("time_spent_min", 0) or 0) for attempt in user_attempts) / total_attempts
        if total_attempts
        else 0.0
    )
    avg_hints_used = (
        sum(float(attempt.get("hints_used", 0) or 0) for attempt in user_attempts) / total_attempts
        if total_attempts
        else 0.0
    )

    return {
        "total_attempts": total_attempts,
        "total_solved": sum(1 for attempt in user_attempts if attempt.get("status") == "solved"),
        "total_partial": sum(1 for attempt in user_attempts if attempt.get("status") == "partial"),
        "total_failed": sum(1 for attempt in user_attempts if attempt.get("status") == "failed"),
        "total_skipped": sum(1 for attempt in user_attempts if attempt.get("status") == "skipped"),
        "tracked_topics": len(topic_stats),
        "overall_success_rate": round(overall_success_rate, 4),
        "avg_time_spent": round(avg_time_spent, 2),
        "avg_hints_used": round(avg_hints_used, 2),
        "weakest_topic": weakest_topic,
        "strongest_topic": strongest_topic,
        "focus_topics": focus_topics,
        "recent_struggle_topics": recent_struggle_topics,
    }


def _compute_attempt_maps(
    user_id: str,
    attempts: list[dict[str, Any]],
) -> tuple[dict[str, list[dict[str, Any]]], dict[str, datetime]]:
    attempts_by_question: dict[str, list[dict[str, Any]]] = defaultdict(list)
    latest_attempt_by_question: dict[str, datetime] = {}

    for attempt in attempts:
        if attempt.get("user_id") != user_id:
            continue

        question_id = str(attempt.get("question_id", ""))
        if not question_id:
            continue

        attempts_by_question[question_id].append(attempt)
        attempted_at = safe_parse_datetime(attempt.get("attempted_at"))
        if attempted_at is not None:
            latest_attempt_by_question[question_id] = max(
                attempted_at,
                latest_attempt_by_question.get(question_id, attempted_at),
            )

    return attempts_by_question, latest_attempt_by_question


def _company_match_score(
    question: dict[str, Any],
    target_company: str | None,
    company_topic_weights: dict[str, dict[str, float]],
) -> float:
    if not target_company:
        return 0.3

    normalized_target = target_company.strip().lower()
    topic = normalize_topic(str(question.get("topic", "")))
    company_match = any(str(company).strip().lower() == normalized_target for company in question.get("companies", []))

    configured_weight = 0.0
    for company_name, topic_weights in company_topic_weights.items():
        if company_name.strip().lower() == normalized_target:
            configured_weight = float(topic_weights.get(topic, 0.0))
            break

    return round(clamp(0.55 * float(company_match) + 0.45 * configured_weight), 4)


def _difficulty_fit_score(question: dict[str, Any], topic_stat: dict[str, Any]) -> tuple[float, float]:
    difficulty = int(question.get("difficulty", 2) or 2)
    topic_level = int(topic_stat.get("inferred_topic_level", 1) or 1)
    difficulty_gap = abs(difficulty - topic_level)

    if difficulty_gap == 0:
        return 1.0, 0.0
    if difficulty_gap == 1:
        return 0.72, 1.0
    return 0.25, float(difficulty_gap)


def _prerequisite_fit_score(prerequisites: list[str], topic_stats: dict[str, dict[str, Any]]) -> float:
    if not prerequisites:
        return 1.0

    scores = [
        float(topic_stats.get(prerequisite, {}).get("mastery_score", 0.35))
        for prerequisite in prerequisites
    ]
    return round(clamp(sum(scores) / len(scores)), 4)


def _novelty_score(question_id: str, attempts_by_question: dict[str, list[dict[str, Any]]]) -> float:
    prior_attempts = len(attempts_by_question.get(question_id, []))
    if prior_attempts == 0:
        return 1.0
    if prior_attempts == 1:
        return 0.55
    return 0.2


def _repetition_need_score(question_id: str, attempts_by_question: dict[str, list[dict[str, Any]]]) -> float:
    question_attempts = attempts_by_question.get(question_id, [])
    if not question_attempts:
        return 0.0

    latest_status = str(question_attempts[-1].get("status", ""))
    if latest_status == "failed":
        return 0.75
    if latest_status == "partial":
        return 0.45
    return 0.1


def build_candidate_features(
    user_id: str,
    target_company: str | None,
    questions: list[dict[str, Any]],
    attempts: list[dict[str, Any]],
    topic_stats: dict[str, dict[str, Any]],
    company_topic_weights: dict[str, dict[str, float]],
) -> list[dict[str, Any]]:
    """Compute ranking features for every candidate question for one user."""
    attempts_by_question, latest_attempt_by_question = _compute_attempt_maps(user_id, attempts)
    now = datetime.now().astimezone()
    features: list[dict[str, Any]] = []

    for question in questions:
        question_id = str(question.get("id", ""))
        topic = normalize_topic(str(question.get("topic", "")))
        prerequisites = [
            normalize_topic(str(item))
            for item in question.get("prerequisites", [])
            if isinstance(item, str)
        ]
        topic_stat = topic_stats.get(
            topic,
            {
                "success_rate": 0.35,
                "avg_time_spent": float(question.get("estimated_time_min", 20) or 20),
                "recent_fail_rate": 0.0,
                "recent_partial_rate": 0.0,
                "weakness_score": 0.65,
                "inferred_topic_level": 1,
            },
        )

        success_rate = float(topic_stat.get("success_rate", 0.35))
        avg_time_spent = float(
            topic_stat.get("avg_time_spent", float(question.get("estimated_time_min", 20) or 20))
        )
        estimated_time_min = float(question.get("estimated_time_min", 20) or 20)
        avg_time_ratio = round(
            clamp(avg_time_spent / max(estimated_time_min, 1.0), 0.0, 2.0) / 2.0,
            4,
        )

        recent_struggle_score = round(
            clamp(
                0.65 * float(topic_stat.get("recent_fail_rate", 0.0))
                + 0.35 * float(topic_stat.get("recent_partial_rate", 0.0))
            ),
            4,
        )

        company_match_score = _company_match_score(question, target_company, company_topic_weights)
        difficulty_fit_score, difficulty_gap = _difficulty_fit_score(question, topic_stat)
        prerequisite_fit_score = _prerequisite_fit_score(prerequisites, topic_stats)
        novelty_score = _novelty_score(question_id, attempts_by_question)
        repetition_need_score = _repetition_need_score(question_id, attempts_by_question)

        recent_attempt = latest_attempt_by_question.get(question_id)
        already_attempted_recently = bool(
            recent_attempt and (now - recent_attempt).days < 7
        )

        features.append(
            {
                "question_id": question_id,
                "topic": topic,
                "difficulty": int(question.get("difficulty", 2) or 2),
                "topic_weakness": float(topic_stat.get("weakness_score", 0.65)),
                "success_rate_in_topic": success_rate,
                "avg_time_ratio": avg_time_ratio,
                "recent_struggle_score": recent_struggle_score,
                "company_match_score": company_match_score,
                "difficulty_fit_score": difficulty_fit_score,
                "prerequisite_fit_score": prerequisite_fit_score,
                "novelty_score": novelty_score,
                "repetition_need_score": repetition_need_score,
                "already_attempted_recently": already_attempted_recently,
                "difficulty_gap": difficulty_gap,
            }
        )

    return features
