from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from threading import Lock


DEFAULT_DIFFICULTY = 2
MIN_DIFFICULTY = 1
MAX_DIFFICULTY = 3
WINDOW_SIZE = 5


@dataclass(frozen=True)
class PerformanceSnapshot:
    user_id: str
    topic: str
    recent_scores: list[float]
    average_score: float
    previous_difficulty: int
    recommended_difficulty: int
    action: str


def clamp_difficulty(level: int) -> int:
    return max(MIN_DIFFICULTY, min(MAX_DIFFICULTY, level))


def next_difficulty_from_average(current_level: int, average_score: float) -> tuple[int, str]:
    if average_score < 40:
        next_level = clamp_difficulty(current_level - 1)
        return next_level, "decrease" if next_level < current_level else "keep"

    if average_score > 75:
        next_level = clamp_difficulty(current_level + 1)
        return next_level, "increase" if next_level > current_level else "keep"

    return current_level, "keep"


class AdaptiveEngine:
    """In-memory adaptive difficulty tracker.

    This is intentionally simple and modular so it can later be replaced by a
    database-backed store fed directly from coding evaluation results.
    """

    def __init__(self) -> None:
        self._history: dict[tuple[str, str], deque[float]] = {}
        self._difficulty: dict[tuple[str, str], int] = {}
        self._lock = Lock()

    def _key(self, user_id: str, topic: str) -> tuple[str, str]:
        normalized_user = user_id.strip()
        normalized_topic = topic.strip().lower()

        if not normalized_user:
            raise ValueError("user_id is required.")
        if not normalized_topic:
            raise ValueError("topic is required.")

        return normalized_user, normalized_topic

    def record_score(
        self,
        user_id: str,
        topic: str,
        score: float,
        difficulty_level: int | None = None,
    ) -> PerformanceSnapshot:
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

            return PerformanceSnapshot(
                user_id=key[0],
                topic=key[1],
                recent_scores=list(history),
                average_score=average_score,
                previous_difficulty=current_level,
                recommended_difficulty=next_level,
                action=action,
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
