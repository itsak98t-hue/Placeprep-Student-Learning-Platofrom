from __future__ import annotations

import json
import random
from dataclasses import dataclass
from pathlib import Path

from schemas.coding import CodingQuestion, NON_CODING_TOPIC_ERROR, SUPPORTED_CODING_TOPICS


VALID_DIFFICULTIES = (1, 2, 3)
PROBLEM_BANK = Path(__file__).resolve().parent.parent / "data" / "coding_problems"


class CodingQuestionSelectionError(Exception):
    """Raised when the coding selector cannot return a safe next question."""


@dataclass(frozen=True)
class CodingQuestionSelectionResult:
    requested_topic: str
    target_difficulty: int
    selected_difficulty: int
    selection_source: str
    question: CodingQuestion


class CodingQuestionSelector:
    """Loads coding-only question banks from JSON and picks the next question."""

    def __init__(self, rng: random.Random | None = None) -> None:
        self._rng = rng or random.Random()

    def _normalize_topic(self, topic: str) -> str:
        normalized = topic.strip().lower()

        if not normalized:
            raise CodingQuestionSelectionError("topic is required.")

        if normalized not in SUPPORTED_CODING_TOPICS:
            raise CodingQuestionSelectionError(NON_CODING_TOPIC_ERROR)

        return normalized

    def _question_file(self, topic: str, difficulty: int) -> Path:
        return PROBLEM_BANK / topic / f"{difficulty}.json"

    def _load_questions(self, topic: str, difficulty: int) -> list[CodingQuestion]:
        path = self._question_file(topic, difficulty)
        if not path.exists():
            return []

        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            raise CodingQuestionSelectionError(f"Question bank file is invalid JSON: {path}") from error

        if not isinstance(payload, list):
            raise CodingQuestionSelectionError(f"Question bank file must contain a list of questions: {path}")

        questions: list[CodingQuestion] = []
        for index, item in enumerate(payload):
            if not isinstance(item, dict):
                continue

            normalized_item = {
                "id": item.get("id", f"{topic}-{difficulty}-{index}"),
                "title": item.get("title", "Untitled Coding Question"),
                "topic": item.get("topic", topic),
                "difficulty": item.get("difficulty", difficulty),
                "prompt": item.get("prompt", ""),
                "tags": item.get("tags", []),
                "hints": item.get("hints", []),
                "starter_code": item.get("starter_code"),
            }
            questions.append(CodingQuestion.model_validate(normalized_item))

        return questions

    def _available_difficulties(self, topic: str) -> set[int]:
        return {level for level in VALID_DIFFICULTIES if self._load_questions(topic, level)}

    def _weighted_difficulty(self, target_difficulty: int, available: set[int]) -> tuple[int, str]:
        weighted_choices = [
            (target_difficulty, 0.70, "same_level"),
            (max(1, target_difficulty - 1), 0.20, "easier"),
            (min(3, target_difficulty + 1), 0.10, "harder"),
        ]

        filtered = [(level, weight, source) for level, weight, source in weighted_choices if level in available]
        if not filtered:
            raise CodingQuestionSelectionError("No coding questions are available for this topic yet.")

        total_weight = sum(weight for _, weight, _ in filtered)
        roll = self._rng.random() * total_weight
        cumulative = 0.0

        for level, weight, source in filtered:
            cumulative += weight
            if roll <= cumulative:
                return level, source

        fallback_level, _, fallback_source = filtered[-1]
        return fallback_level, fallback_source

    def select_next_question(
        self,
        topic: str,
        target_difficulty: int,
        exclude_question_ids: list[str] | None = None,
    ) -> CodingQuestionSelectionResult:
        normalized_topic = self._normalize_topic(topic)
        excluded = set(exclude_question_ids or [])
        available_difficulties = self._available_difficulties(normalized_topic)

        if not available_difficulties:
            raise CodingQuestionSelectionError(f"No coding questions are available yet for topic '{normalized_topic}'.")

        selected_difficulty, selection_source = self._weighted_difficulty(target_difficulty, available_difficulties)
        candidate_questions = [
            question
            for question in self._load_questions(normalized_topic, selected_difficulty)
            if question.id not in excluded
        ]

        if not candidate_questions:
            for fallback_level in sorted(available_difficulties, key=lambda level: abs(level - target_difficulty)):
                fallback_questions = [
                    question
                    for question in self._load_questions(normalized_topic, fallback_level)
                    if question.id not in excluded
                ]
                if fallback_questions:
                    selected_difficulty = fallback_level
                    selection_source = "fallback"
                    candidate_questions = fallback_questions
                    break

        if not candidate_questions:
            raise CodingQuestionSelectionError("No unused coding questions are available for this topic right now.")

        return CodingQuestionSelectionResult(
            requested_topic=normalized_topic,
            target_difficulty=target_difficulty,
            selected_difficulty=selected_difficulty,
            selection_source=selection_source,
            question=self._rng.choice(candidate_questions),
        )
