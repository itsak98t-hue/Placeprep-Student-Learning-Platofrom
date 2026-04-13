from __future__ import annotations

from pathlib import Path

from coding.engine.performance_tracker import compute_topic_scores, get_weak_topics, recommend_difficulty_for_topic
from coding.models.schemas import CodingQuestion, DifficultyLevel
from coding.utils.helpers import (
    DIFFICULTY_ORDER,
    load_json_data,
    normalize_difficulty,
    normalize_topic,
)


def _load_questions(questions_path: Path) -> list[CodingQuestion]:
    raw_questions = load_json_data(questions_path, default=[])
    return [CodingQuestion.model_validate(item) for item in raw_questions]


def _get_seen_question_ids(user_id: str, performance_path: Path) -> set[str]:
    raw_records = load_json_data(performance_path, default=[])
    seen_ids: set[str] = set()

    for item in raw_records:
        if item.get("user_id") == user_id and item.get("question_id"):
            seen_ids.add(str(item["question_id"]))

    return seen_ids


def _sort_questions(questions: list[CodingQuestion]) -> list[CodingQuestion]:
    return sorted(
        questions,
        key=lambda question: (
            DIFFICULTY_ORDER[question.difficulty],
            normalize_topic(question.topic),
            question.title.lower(),
        ),
    )


def _pick_candidate_questions(
    *,
    questions: list[CodingQuestion],
    topic: str,
    difficulty: DifficultyLevel,
    seen_ids: set[str],
) -> list[CodingQuestion]:
    normalized_topic = normalize_topic(topic)
    normalized_difficulty = normalize_difficulty(difficulty)

    unsolved = [
        question
        for question in questions
        if normalize_topic(question.topic) == normalized_topic
        and normalize_difficulty(question.difficulty) == normalized_difficulty
        and question.id not in seen_ids
    ]
    if unsolved:
        return _sort_questions(unsolved)

    revisitable = [
        question
        for question in questions
        if normalize_topic(question.topic) == normalized_topic
        and normalize_difficulty(question.difficulty) == normalized_difficulty
    ]
    return _sort_questions(revisitable)


def get_next_question_recommendation(
    *,
    user_id: str,
    preferred_topic: str | None,
    preferred_difficulty: DifficultyLevel | None,
    questions_path: Path,
    performance_path: Path,
) -> tuple[CodingQuestion, str, dict[str, int]]:
    if not user_id.strip():
        raise ValueError("user_id is required.")

    questions = _load_questions(questions_path)
    if not questions:
        raise ValueError("No coding questions are available.")

    topic_scores = compute_topic_scores(user_id, performance_path)
    weak_topics = get_weak_topics(user_id, performance_path)
    seen_ids = _get_seen_question_ids(user_id, performance_path)

    if preferred_topic:
        selected_topic = normalize_topic(preferred_topic)
        reason_prefix = f"Prioritizing your requested topic '{selected_topic}'."
    elif weak_topics:
        selected_topic = weak_topics[0]
        reason_prefix = f"Recommending a weaker topic based on recent performance: '{selected_topic}'."
    else:
        selected_topic = normalize_topic(questions[0].topic)
        reason_prefix = f"No weak-topic signal yet, so starting with '{selected_topic}'."

    available_topics = {normalize_topic(question.topic) for question in questions}
    if selected_topic not in available_topics:
        raise ValueError(f"No questions available for topic '{selected_topic}'.")

    selected_difficulty = preferred_difficulty or recommend_difficulty_for_topic(
        user_id=user_id,
        topic=selected_topic,
        performance_path=performance_path,
        fallback="medium",
    )

    candidates = _pick_candidate_questions(
        questions=questions,
        topic=selected_topic,
        difficulty=selected_difficulty,
        seen_ids=seen_ids,
    )

    if not candidates:
        fallback_difficulties: list[DifficultyLevel] = ["easy", "medium", "hard"]
        for difficulty in fallback_difficulties:
            candidates = _pick_candidate_questions(
                questions=questions,
                topic=selected_topic,
                difficulty=difficulty,
                seen_ids=seen_ids,
            )
            if candidates:
                selected_difficulty = difficulty
                break

    if not candidates:
        raise ValueError("No suitable coding question could be selected.")

    selected_question = candidates[0]
    reason = (
        f"{reason_prefix} Serving a {normalize_difficulty(selected_difficulty)} question and "
        f"preferring unsolved items first."
    )
    return selected_question, reason, topic_scores
