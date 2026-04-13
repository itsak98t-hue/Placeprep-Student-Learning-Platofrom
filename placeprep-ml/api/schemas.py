from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


EvaluationBand = Literal["weak", "average", "strong"]


class EvaluationRequest(BaseModel):
    question: str = Field(..., min_length=5)
    answer: str = Field(..., min_length=5)


class DimensionScores(BaseModel):
    relevance: float = Field(..., ge=0, le=100)
    clarity: float = Field(..., ge=0, le=100)
    structure: float = Field(..., ge=0, le=100)
    specificity: float = Field(..., ge=0, le=100)
    confidence_tone: float = Field(..., ge=0, le=100)
    grammar_basic: float = Field(..., ge=0, le=100)


class EvaluationSignals(BaseModel):
    word_count: int = Field(..., ge=0)
    sentence_count: int = Field(..., ge=0)
    semantic_similarity: float = Field(..., ge=0, le=1)
    keyword_overlap: float = Field(..., ge=0, le=1)
    theme_match: float = Field(..., ge=0, le=1)
    has_context: bool
    has_action: bool
    has_result: bool
    has_metrics: bool
    has_first_person: bool
    gibberish_detected: bool
    generic_answer: bool
    gibberish_reason: str | None = None
    applied_score_cap: float | None = Field(default=None, ge=0, le=100)


class EvaluationResponse(BaseModel):
    question: str
    answer: str
    final_score: float = Field(..., ge=0, le=100)
    band: EvaluationBand
    dimension_scores: DimensionScores
    signals: EvaluationSignals
    strengths: list[str]
    improvements: list[str]
    suggested_better_answer: str
