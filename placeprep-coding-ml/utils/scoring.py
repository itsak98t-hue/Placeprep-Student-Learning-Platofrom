from __future__ import annotations

from typing import Any


DEFAULT_WEIGHTS: dict[str, float] = {
    "topic_weakness": 0.30,
    "recent_struggle_score": 0.20,
    "company_match_score": 0.15,
    "difficulty_fit_score": 0.15,
    "prerequisite_fit_score": 0.10,
    "novelty_score": 0.05,
    "repetition_need_score": 0.05,
}

DEFAULT_PENALTIES: dict[str, float] = {
    "recent_attempt_penalty": 0.18,
    "difficulty_jump_penalty": 0.14,
    "prerequisite_gap_penalty": 0.22,
}


def clamp(value: float, lower: float = 0.0, upper: float = 1.0) -> float:
    """Keep scores in a clean 0..1 range."""
    return max(lower, min(upper, value))


def score_candidate(
    features: dict[str, Any],
    weights: dict[str, float] | None = None,
    penalties: dict[str, float] | None = None,
) -> float:
    """Compute an explainable final recommendation score for one question."""
    active_weights = weights or DEFAULT_WEIGHTS
    active_penalties = penalties or DEFAULT_PENALTIES

    base_score = sum(
        float(active_weights.get(feature_name, 0.0)) * float(features.get(feature_name, 0.0))
        for feature_name in active_weights
    )

    penalty_total = 0.0
    if bool(features.get("already_attempted_recently", False)):
        penalty_total += active_penalties["recent_attempt_penalty"]
    if float(features.get("difficulty_gap", 0.0)) > 1.0:
        penalty_total += active_penalties["difficulty_jump_penalty"]
    if float(features.get("prerequisite_fit_score", 0.0)) < 0.35:
        penalty_total += active_penalties["prerequisite_gap_penalty"]

    return round(clamp(base_score - penalty_total), 4)
