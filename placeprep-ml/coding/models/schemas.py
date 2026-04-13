from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


CodingTopic = Literal[
    "arrays",
    "strings",
    "dp",
    "graph",
    "hashing",
    "two_pointers",
    "stack",
    "queue",
    "linked_list",
    "tree",
    "recursion",
    "binary_search",
]

DifficultyLevel = Literal["easy", "medium", "hard"]
PerformanceStatus = Literal["solved", "failed", "partial"]


class CodingQuestion(BaseModel):
    id: str
    title: str
    topic: CodingTopic
    difficulty: DifficultyLevel
    company_tags: list[str]
    problem_statement: str
    hints: list[str]
    patterns: list[str]


class PerformanceRecord(BaseModel):
    user_id: str = Field(..., min_length=1)
    question_id: str = Field(..., min_length=1)
    topic: CodingTopic
    difficulty: DifficultyLevel
    status: PerformanceStatus
    time_taken_sec: int = Field(..., ge=0)
    hints_used: int = Field(..., ge=0)


class QuestionVariant(BaseModel):
    variant_id: str
    source_question_id: str
    title: str
    topic: CodingTopic
    difficulty: DifficultyLevel
    problem_statement: str
    hints: list[str]
    patterns: list[str]


class NextQuestionRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    preferred_topic: CodingTopic | None = None
    preferred_difficulty: DifficultyLevel | None = None


class NextQuestionResponse(BaseModel):
    question: CodingQuestion
    reason: str
    weak_topics: list[str]
    topic_scores: dict[str, int]


class UpdatePerformanceRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    question_id: str = Field(..., min_length=1)
    topic: CodingTopic
    difficulty: DifficultyLevel
    status: PerformanceStatus
    time_taken_sec: int = Field(..., ge=0)
    hints_used: int = Field(..., ge=0)


class UpdatePerformanceResponse(BaseModel):
    success: bool
    message: str
    stored_record: dict
    weak_topics: list[str]
    topic_scores: dict[str, int]


class GenerateVariantsRequest(BaseModel):
    question_id: str = Field(..., min_length=1)


class GenerateVariantsResponse(BaseModel):
    source_question: CodingQuestion
    variants: list[QuestionVariant]


class CodingHealthResponse(BaseModel):
    status: str
    questions_loaded: int
    performance_records: int
