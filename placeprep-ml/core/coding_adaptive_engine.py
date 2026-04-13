from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from threading import Lock

from schemas.coding import NON_CODING_TOPIC_ERROR, SUPPORTED_CODING_TOPICS


DEFAULT_DIFFICULTY = 2
MIN_DIFFICULTY = 1
MAX_DIFFICULTY = 3
WINDOW_SIZE = 5


@dataclass(frozen=True)
class CodingPerformanceSnapshot:
    user_id: str
    topic: str
    recent_scores: list[float]
    average_score: float
    previous_difficulty: int
    recommended_difficulty: int
    action: str
    explanation: str


def clamp_difficulty(level: int) -> int:
    return max(MIN_DIFFICULTY, min(MAX_DIFFICULTY, level))


def validate_coding_topic(topic: str) -> str:
    normalized_topic = topic.strip().lower()

    if not normalized_topic:
        raise ValueError("topic is required.")

    if normalized_topic not in SUPPORTED_CODING_TOPICS:
        raise ValueError(NON_CODING_TOPIC_ERROR)

    return normalized_topic


def next_difficulty_from_average(current_level: int, average_score: float) -> tuple[int, str]:
    if average_score < 40:
        # Report the intended action from performance, even if the bounded
        # difficulty cannot move below the minimum allowed level.
        next_level = clamp_difficulty(current_level - 1)
        return next_level, "decrease"

    if average_score > 75:
        # Report the intended action from performance, even if the bounded
        # difficulty cannot move above the maximum allowed level.
        next_level = clamp_difficulty(current_level + 1)
        return next_level, "increase"

    return current_level, "keep"


def build_difficulty_explanation(
    previous_difficulty: int,
    recommended_difficulty: int,
    action: str,
) -> str:
    if action == "decrease" and recommended_difficulty == MIN_DIFFICULTY and previous_difficulty == MIN_DIFFICULTY:
        return "Recent performance is low, but difficulty is already at the minimum level."

    if action == "increase" and recommended_difficulty == MAX_DIFFICULTY and previous_difficulty == MAX_DIFFICULTY:
        return "Recent performance is strong, but difficulty is already at the maximum level."

    if action == "decrease":
        return "Recent performance is low, reducing difficulty."

    if action == "increase":
        return "Recent performance is strong, increasing difficulty."

    return "Recent performance is balanced, keeping difficulty same."


class CodingAdaptiveEngine:
    """Tracks coding-only performance by user and topic.

    The store is in-memory for now so it can be replaced later by a persistent
    source that consumes coding evaluator results directly.
    """

    def __init__(self) -> None:
        self._history: dict[tuple[str, str], deque[float]] = {}
        self._difficulty: dict[tuple[str, str], int] = {}
        self._lock = Lock()

    def _key(self, user_id: str, topic: str) -> tuple[str, str]:
        normalized_user = user_id.strip()
        normalized_topic = validate_coding_topic(topic)

        if not normalized_user:
            raise ValueError("user_id is required.")

        return normalized_user, normalized_topic

    def record_score(
        self,
        user_id: str,
        topic: str,
        score: float,
        difficulty_level: int | None = None,
    ) -> CodingPerformanceSnapshot:
        if not 0 <= score <= 100:
            raise ValueError("score must be between 0 and 100.")

        key = self._key(user_id, topic)

        with self._lock:
            history = self._history.setdefault(key, deque(maxlen=WINDOW_SIZE))
            current_level = self._difficulty.get(key, clamp_difficulty(difficulty_level or DEFAULT_DIFFICULTY))

            if difficulty_level is not None:
                current_level = clamp_difficulty(difficulty_level)

            history.append(round(float(score), 1))
            average_score = round(sum(history) / len(history), 1)
            next_level, action = next_difficulty_from_average(current_level, average_score)
            self._difficulty[key] = next_level

            return CodingPerformanceSnapshot(
                user_id=key[0],
                topic=key[1],
                recent_scores=list(history),
                average_score=average_score,
                previous_difficulty=current_level,
                recommended_difficulty=next_level,
                action=action,
                explanation=build_difficulty_explanation(current_level, next_level, action),
            )

    def get_target_difficulty(
        self,
        user_id: str,
        topic: str,
        preferred_difficulty: int | None = None,
    ) -> int:
        key = self._key(user_id, topic)

        with self._lock:
            if preferred_difficulty is not None:
                level = clamp_difficulty(preferred_difficulty)
                self._difficulty.setdefault(key, level)
                return level

            return self._difficulty.get(key, DEFAULT_DIFFICULTY)
