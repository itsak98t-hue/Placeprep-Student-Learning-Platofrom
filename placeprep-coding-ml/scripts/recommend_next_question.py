from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from utils.data_loader import (
    get_question_lookup,
    load_attempts,
    load_company_topic_weights,
    load_questions,
    normalize_topic,
)
from utils.feature_engineering import build_candidate_features, compute_topic_stats
from utils.filters import filter_candidate_questions
from utils.scoring import score_candidate


TOPIC_DISPLAY_NAMES = {
    "arrays": "Arrays",
    "strings": "Strings",
    "binary_search": "Binary Search",
    "trees": "Trees",
    "graphs": "Graphs",
    "dp": "Dynamic Programming",
    "sliding_window": "Sliding Window",
    "recursion": "Recursion",
}


def serialize_question(question: dict[str, Any] | None) -> dict[str, Any] | None:
    """Return a stable frontend-friendly question payload."""
    if question is None:
        return None

    return {
        "question_id": str(question.get("id", "")),
        "title": str(question.get("title", "")),
        "platform": str(question.get("platform", "")),
        "external_link": str(question.get("external_link", "")),
        "topic": normalize_topic(str(question.get("topic", ""))),
        "subtopic": str(question.get("subtopic", "")),
        "difficulty": int(question.get("difficulty", 2) or 2),
        "pattern": str(question.get("pattern", "")),
        "companies": [str(company) for company in question.get("companies", []) if isinstance(company, str)],
        "prerequisites": [normalize_topic(str(item)) for item in question.get("prerequisites", []) if isinstance(item, str)],
        "estimated_time_min": int(question.get("estimated_time_min", 20) or 20),
        "hint_levels": [str(item) for item in question.get("hint_levels", []) if isinstance(item, str)],
        "fallback_question_ids": [str(item) for item in question.get("fallback_question_ids", []) if isinstance(item, str)],
        "upgrade_question_ids": [str(item) for item in question.get("upgrade_question_ids", []) if isinstance(item, str)],
        "similar_question_ids": [str(item) for item in question.get("similar_question_ids", []) if isinstance(item, str)],
    }


def rank_candidates(
    candidates: list[dict[str, Any]],
    candidate_features: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Attach scores to candidate questions and sort them best-first."""
    feature_lookup = {feature["question_id"]: feature for feature in candidate_features}
    ranked: list[dict[str, Any]] = []

    for question in candidates:
        question_id = str(question.get("id", ""))
        features = feature_lookup.get(question_id)
        if not features:
            continue

        ranked.append(
            {
                "question": question,
                "features": features,
                "score": score_candidate(features),
            }
        )

    ranked.sort(key=lambda item: item["score"], reverse=True)
    return ranked


def _stable_question_dedup(questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    deduped: list[dict[str, Any]] = []
    seen_question_ids: set[str] = set()

    for question in questions:
        question_id = str(question.get("id", ""))
        if question_id and question_id not in seen_question_ids:
            deduped.append(question)
            seen_question_ids.add(question_id)

    return deduped


def _sort_candidate_pool(
    pool: list[dict[str, Any]],
    ranked_candidates: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    ranked_question_ids = [str(item["question"].get("id", "")) for item in ranked_candidates]
    ranked_order = {question_id: index for index, question_id in enumerate(ranked_question_ids)}

    return sorted(
        pool,
        key=lambda question: ranked_order.get(str(question.get("id", "")), len(ranked_candidates) + 999),
    )


def _preferred_related_questions(
    primary_question: dict[str, Any],
    question_lookup: dict[str, dict[str, Any]],
    key: str,
) -> list[dict[str, Any]]:
    primary_id = str(primary_question.get("id", ""))
    preferred_ids = [str(item) for item in primary_question.get(key, []) if isinstance(item, str)]

    return [
        question_lookup[question_id]
        for question_id in preferred_ids
        if question_id in question_lookup and question_id != primary_id
    ]


def _same_topic_related_questions(
    primary_question: dict[str, Any],
    all_questions: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    primary_id = str(primary_question.get("id", ""))
    primary_topic = normalize_topic(str(primary_question.get("topic", "")))
    primary_subtopic = str(primary_question.get("subtopic", "")).strip().lower()

    same_subtopic_questions = [
        question
        for question in all_questions
        if str(question.get("id", "")) != primary_id
        and normalize_topic(str(question.get("topic", ""))) == primary_topic
        and str(question.get("subtopic", "")).strip().lower() == primary_subtopic
    ]
    same_topic_questions = [
        question
        for question in all_questions
        if str(question.get("id", "")) != primary_id
        and normalize_topic(str(question.get("topic", ""))) == primary_topic
    ]

    return _stable_question_dedup(same_subtopic_questions + same_topic_questions)


def _ladder_candidates_for_direction(
    primary_question: dict[str, Any],
    sorted_pool: list[dict[str, Any]],
    direction: str,
) -> list[dict[str, Any]]:
    primary_difficulty = int(primary_question.get("difficulty", 2) or 2)

    def difficulty(question: dict[str, Any]) -> int:
        return int(question.get("difficulty", 2) or 2)

    if direction == "easier":
        exact_step = [
            question for question in sorted_pool if difficulty(question) == max(1, primary_difficulty - 1)
        ]
        remaining_lower = [
            question for question in sorted_pool if difficulty(question) < primary_difficulty and question not in exact_step
        ]
        same_difficulty_fallback = [
            question for question in sorted_pool if difficulty(question) == primary_difficulty and question not in exact_step
        ]
        return _stable_question_dedup(exact_step + remaining_lower + same_difficulty_fallback)

    exact_step = [
        question for question in sorted_pool if difficulty(question) == min(3, primary_difficulty + 1)
    ]
    remaining_higher = [
        question for question in sorted_pool if difficulty(question) > primary_difficulty and question not in exact_step
    ]
    same_difficulty_extension = [
        question for question in sorted_pool if difficulty(question) == primary_difficulty and question not in exact_step
    ]
    return _stable_question_dedup(exact_step + remaining_higher + same_difficulty_extension)


def build_related_ladder(
    primary_question: dict[str, Any],
    all_questions: list[dict[str, Any]],
    ranked_candidates: list[dict[str, Any]],
    direction: str,
    *,
    limit: int = 3,
) -> list[dict[str, Any]]:
    """Build a ranked easier/harder ladder around the primary recommendation."""
    question_lookup = get_question_lookup(all_questions)
    preferred_key = "fallback_question_ids" if direction == "easier" else "upgrade_question_ids"
    preferred_questions = _preferred_related_questions(primary_question, question_lookup, preferred_key)
    same_topic_questions = _same_topic_related_questions(primary_question, all_questions)
    combined_pool = _stable_question_dedup(preferred_questions + same_topic_questions)
    sorted_pool = _sort_candidate_pool(combined_pool, ranked_candidates)
    direction_candidates = _ladder_candidates_for_direction(primary_question, sorted_pool, direction)
    return direction_candidates[:limit]


def build_similar_questions(
    primary_question: dict[str, Any],
    all_questions: list[dict[str, Any]],
    ranked_candidates: list[dict[str, Any]],
    *,
    excluded_question_ids: set[str],
    limit: int = 3,
) -> list[dict[str, Any]]:
    """Build a small set of closely related same-topic alternatives."""
    question_lookup = get_question_lookup(all_questions)
    preferred_questions = _preferred_related_questions(primary_question, question_lookup, "similar_question_ids")
    primary_id = str(primary_question.get("id", ""))
    primary_topic = normalize_topic(str(primary_question.get("topic", "")))
    primary_difficulty = int(primary_question.get("difficulty", 2) or 2)

    same_topic_same_difficulty = [
        question
        for question in all_questions
        if str(question.get("id", "")) != primary_id
        and normalize_topic(str(question.get("topic", ""))) == primary_topic
        and int(question.get("difficulty", 2) or 2) == primary_difficulty
    ]

    combined_pool = _stable_question_dedup(preferred_questions + same_topic_same_difficulty)
    sorted_pool = _sort_candidate_pool(combined_pool, ranked_candidates)

    similar_questions = [
        question
        for question in sorted_pool
        if str(question.get("id", "")) not in excluded_question_ids
    ]
    return similar_questions[:limit]


def _difficulty_label(value: int) -> str:
    return {1: "easy", 2: "medium", 3: "hard"}.get(value, "medium")


def build_recommendation_reason(
    primary_question: dict[str, Any],
    primary_features: dict[str, Any],
    topic_stats: dict[str, dict[str, Any]],
    target_company: str | None,
    easier_questions: list[dict[str, Any]],
    harder_questions: list[dict[str, Any]],
) -> str:
    """Create a short human-readable explanation for the recommendation."""
    topic = normalize_topic(str(primary_question.get("topic", "")))
    topic_label = TOPIC_DISPLAY_NAMES.get(topic, topic.replace("_", " ").title())
    topic_stats_entry = topic_stats.get(topic, {})
    mastery_score = float(topic_stats_entry.get("mastery_score", 0.35))
    recent_fail_rate = float(topic_stats_entry.get("recent_fail_rate", 0.0))
    recent_partial_rate = float(topic_stats_entry.get("recent_partial_rate", 0.0))
    difficulty_label = _difficulty_label(int(primary_question.get("difficulty", 2) or 2))
    subtopic = str(primary_question.get("subtopic", "fundamentals"))

    if recent_fail_rate >= 0.4:
        opening = (
            f"You recently struggled with {difficulty_label} {topic_label} questions, so this {difficulty_label} "
            f"{subtopic} problem is recommended to rebuild fundamentals."
        )
    elif float(primary_features.get("topic_weakness", 0.0)) >= 0.65:
        opening = (
            f"Your {topic_label} mastery is currently low, so this {difficulty_label} {subtopic} question is a targeted repair step."
        )
    elif recent_partial_rate >= 0.3:
        opening = (
            f"You are close to breaking through in {topic_label}, and this {difficulty_label} {subtopic} question should help convert partial progress into solves."
        )
    elif mastery_score >= 0.7:
        opening = (
            f"You are performing steadily in {topic_label}, so this {difficulty_label} {subtopic} question is a safe progression without a sharp difficulty jump."
        )
    else:
        opening = (
            f"This {difficulty_label} {topic_label} question matches your current level and keeps practice focused on {subtopic}."
        )

    company_line = ""
    if target_company and float(primary_features.get("company_match_score", 0.0)) >= 0.65:
        company_line = f" It also aligns well with your {target_company} interview goal."

    support_line = ""
    first_easier = easier_questions[0] if easier_questions else None
    first_harder = harder_questions[0] if harder_questions else None
    if first_easier and first_harder:
        support_line = (
            f" If you want a gentler step, move down to {first_easier.get('title', 'the easier option')}. "
            f"If this feels comfortable, keep climbing with {first_harder.get('title', 'the next harder option')}."
        )
    elif first_easier:
        support_line = f" If this still feels heavy, step down to {first_easier.get('title', 'the easier option')} first."
    elif first_harder:
        support_line = f" If this feels manageable, move up to {first_harder.get('title', 'the next harder option')} afterward."

    return opening + company_line + support_line


def recommend_next_question(user_id: str, target_company: str | None = None) -> dict[str, Any]:
    """Return the next best coding question plus a multi-step easier/harder ladder."""
    questions = load_questions()
    attempts = load_attempts()
    company_topic_weights = load_company_topic_weights()

    topic_stats = compute_topic_stats(user_id, attempts, questions)
    candidate_pool = filter_candidate_questions(
        user_id=user_id,
        questions=questions,
        attempts=attempts,
        topic_stats=topic_stats,
        target_company=target_company,
    )
    if not candidate_pool:
        candidate_pool = questions

    candidate_features = build_candidate_features(
        user_id=user_id,
        target_company=target_company,
        questions=candidate_pool,
        attempts=attempts,
        topic_stats=topic_stats,
        company_topic_weights=company_topic_weights,
    )
    ranked_candidates = rank_candidates(candidate_pool, candidate_features)

    if not ranked_candidates:
        raise ValueError("No coding recommendation candidates are available for this user yet.")

    primary_bundle = ranked_candidates[0]
    primary_question = primary_bundle["question"]
    primary_features = primary_bundle["features"]

    easier_questions = build_related_ladder(
        primary_question=primary_question,
        all_questions=questions,
        ranked_candidates=ranked_candidates,
        direction="easier",
    )
    harder_questions = build_related_ladder(
        primary_question=primary_question,
        all_questions=questions,
        ranked_candidates=ranked_candidates,
        direction="harder",
    )

    excluded_question_ids = {
        str(primary_question.get("id", "")),
        *[str(question.get("id", "")) for question in easier_questions],
        *[str(question.get("id", "")) for question in harder_questions],
    }
    similar_questions = build_similar_questions(
        primary_question=primary_question,
        all_questions=questions,
        ranked_candidates=ranked_candidates,
        excluded_question_ids=excluded_question_ids,
    )

    reason = build_recommendation_reason(
        primary_question=primary_question,
        primary_features=primary_features,
        topic_stats=topic_stats,
        target_company=target_company,
        easier_questions=easier_questions,
        harder_questions=harder_questions,
    )

    return {
        "user_id": user_id,
        "target_company": target_company,
        "focus_topic": normalize_topic(str(primary_question.get("topic", ""))),
        "primary_question": serialize_question(primary_question),
        "easier_questions": [serialize_question(question) for question in easier_questions],
        "harder_questions": [serialize_question(question) for question in harder_questions],
        "similar_questions": [serialize_question(question) for question in similar_questions],
        "reason": reason,
    }


def main() -> None:
    """CLI wrapper for quick recommendation debugging."""
    user_id = sys.argv[1] if len(sys.argv) > 1 else "u1"
    target_company = sys.argv[2] if len(sys.argv) > 2 else "Amazon"
    recommendation = recommend_next_question(user_id=user_id, target_company=target_company)
    print(json.dumps(recommendation, indent=2))


if __name__ == "__main__":
    main()
