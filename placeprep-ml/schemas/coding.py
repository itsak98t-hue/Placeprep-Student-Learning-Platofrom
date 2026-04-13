from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


SUPPORTED_CODING_TOPICS = (
    "arrays",
    "strings",
    "hashing",
    "two_pointers",
    "stack",
    "queue",
    "linked_list",
    "tree",
    "graph",
    "dp",
    "recursion",
    "binary_search",
)

NON_CODING_TOPIC_ERROR = "Adaptive difficulty is only available for coding topics."

DifficultyLevel = Literal[1, 2, 3]
SelectionSource = Literal["same_level", "easier", "harder", "fallback"]
DifficultyAction = Literal["decrease", "increase", "keep"]


class CodingQuestion(BaseModel):
    id: str
    title: str
    topic: str
    difficulty: DifficultyLevel
    prompt: str
    tags: list[str] = Field(default_factory=list)
    hints: list[str] = Field(default_factory=list)
    starter_code: str | None = None


class CodingUpdatePerformanceRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    topic: str = Field(..., min_length=1)
    score: float = Field(..., ge=0, le=100)
    difficulty_level: DifficultyLevel | None = None


class CodingUpdatePerformanceResponse(BaseModel):
    user_id: str
    topic: str
    recent_scores: list[float]
    average_score: float = Field(..., ge=0, le=100)
    previous_difficulty: DifficultyLevel
    recommended_difficulty: DifficultyLevel
    action: DifficultyAction
    explanation: str


class CodingNextQuestionRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    topic: str = Field(..., min_length=1)
    preferred_difficulty: DifficultyLevel | None = None
    exclude_question_ids: list[str] = Field(default_factory=list)


class CodingNextQuestionResponse(BaseModel):
    user_id: str
    requested_topic: str
    target_difficulty: DifficultyLevel
    selected_difficulty: DifficultyLevel
    selection_source: SelectionSource
    question: CodingQuestion
