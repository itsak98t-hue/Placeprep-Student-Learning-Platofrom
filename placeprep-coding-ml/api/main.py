from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any, Literal
import sys

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from scripts.recommend_next_question import recommend_next_question
from utils.data_loader import append_attempt, get_question_lookup, load_attempts, load_questions, normalize_topic
from utils.feature_engineering import build_user_summary, compute_topic_stats
from utils.groq_client import groq_client
from utils.prompt_builder import (
    build_explain_system_prompt,
    build_explain_user_prompt,
    build_hint_system_prompt,
    build_hint_user_prompt,
)


AttemptStatus = Literal["solved", "partial", "failed", "skipped"]
LOCAL_DEV_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


class HealthResponse(BaseModel):
    status: str
    service: str


class CodingRecommendRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    target_company: str | None = None


class CodingQuestionResponse(BaseModel):
    question_id: str
    title: str
    platform: str
    external_link: str
    topic: str
    subtopic: str
    difficulty: int
    pattern: str
    companies: list[str]
    prerequisites: list[str]
    estimated_time_min: int
    hint_levels: list[str]
    fallback_question_ids: list[str]
    upgrade_question_ids: list[str]
    similar_question_ids: list[str]


class CodingRecommendationResponse(BaseModel):
    user_id: str
    target_company: str | None
    focus_topic: str
    primary_question: CodingQuestionResponse
    easier_questions: list[CodingQuestionResponse]
    harder_questions: list[CodingQuestionResponse]
    similar_questions: list[CodingQuestionResponse]
    reason: str


class CodingAttemptRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    question_id: str = Field(..., min_length=1)
    status: AttemptStatus
    time_spent_min: int = Field(..., ge=0)
    hints_used: int = Field(..., ge=0)
    confidence: int = Field(..., ge=1, le=5)


class CodingAttemptRecord(BaseModel):
    user_id: str
    question_id: str
    topic: str
    difficulty: int
    status: AttemptStatus
    time_spent_min: int
    hints_used: int
    confidence: int
    attempted_at: str


class CodingAttemptResponse(BaseModel):
    success: bool
    message: str
    attempt: CodingAttemptRecord


class HintRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    question_id: str = Field(..., min_length=1)
    status: AttemptStatus
    hint_level: int = Field(..., ge=1, le=5)


class HintResponse(BaseModel):
    hint: str
    hint_level: int
    source: str


class ExplainRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    question_id: str = Field(..., min_length=1)
    status: AttemptStatus
    time_spent_min: int = Field(..., ge=0)
    hints_used: int = Field(..., ge=0)
    confidence: int = Field(..., ge=1, le=5)


class ExplainResponse(BaseModel):
    explanation: str
    focus_areas: list[str]
    source: str


class CodingUserSummaryResponse(BaseModel):
    total_attempts: int
    total_solved: int
    total_partial: int
    total_failed: int
    total_skipped: int
    tracked_topics: int
    overall_success_rate: float
    avg_time_spent: float
    avg_hints_used: float
    weakest_topic: str | None
    strongest_topic: str | None
    focus_topics: list[str]
    recent_struggle_topics: list[str]


class CodingUserStatsResponse(BaseModel):
    user_id: str
    summary: CodingUserSummaryResponse
    topic_stats: dict[str, dict[str, Any]]


app = FastAPI(title="PlacePrep Coding Recommendation Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=LOCAL_DEV_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_recent_attempts_for_user(
    user_id: str,
    attempts: list[dict[str, Any]],
    *,
    question_id: str | None = None,
    topic: str | None = None,
    limit: int = 5,
) -> list[dict[str, Any]]:
    filtered_attempts = [
        attempt
        for attempt in attempts
        if attempt.get("user_id") == user_id
        and (question_id is None or attempt.get("question_id") == question_id)
        and (topic is None or normalize_topic(str(attempt.get("topic", ""))) == topic)
    ]

    filtered_attempts.sort(key=lambda attempt: str(attempt.get("attempted_at", "")), reverse=True)
    return filtered_attempts[:limit]


def get_static_hint(question: dict[str, Any], hint_level: int) -> str:
    static_hints = [str(item) for item in question.get("hint_levels", []) if isinstance(item, str)]
    if static_hints:
        index = min(max(hint_level - 1, 0), len(static_hints) - 1)
        return static_hints[index]

    topic = normalize_topic(str(question.get("topic", ""))).replace("_", " ")
    pattern = str(question.get("pattern", "the core pattern")).strip() or "the core pattern"
    return f"Start by identifying the main {pattern} idea in this {topic} problem before thinking about edge cases."


def build_fallback_explanation(
    *,
    question: dict[str, Any],
    status: AttemptStatus,
    time_spent_min: int,
    hints_used: int,
    confidence: int,
) -> ExplainResponse:
    topic_label = normalize_topic(str(question.get("topic", ""))).replace("_", " ")
    subtopic = str(question.get("subtopic", "the core idea")).strip() or "the core idea"
    pattern = str(question.get("pattern", "the main pattern")).strip() or "the main pattern"

    struggle_reason = "You likely got stuck translating the pattern into a clear step-by-step plan."
    if status == "failed":
        struggle_reason = "You likely got blocked on recognizing the right pattern early enough."
    elif status == "partial":
        struggle_reason = "You were close, but the final structure or edge-case reasoning probably was not stable yet."
    elif confidence <= 2:
        struggle_reason = "Low confidence usually means the idea is only partially formed even if you recognized the topic."
    elif time_spent_min >= int(question.get("estimated_time_min", 20) or 20) + 10:
        struggle_reason = "The longer solve time suggests the approach was not settling into a simple invariant."

    explanation = (
        f"{struggle_reason} For this question, focus on {subtopic} inside {topic_label}, "
        f"especially how {pattern} simplifies the decision at each step."
    )

    focus_areas = [
        f"State the core invariant for {pattern} in one sentence.",
        f"Practice recognizing when {subtopic} appears in {topic_label} questions.",
        "Rehearse the smallest dry run before thinking about full edge cases.",
    ]

    if hints_used >= 2:
        focus_areas[2] = "Pause earlier and write the key observation before asking for another hint."

    return ExplainResponse(
        explanation=explanation,
        focus_areas=focus_areas,
        source="fallback",
    )


def sanitize_focus_areas(payload: Any) -> list[str]:
    if not isinstance(payload, list):
        return []

    cleaned_focus_areas = [str(item).strip() for item in payload if str(item).strip()]
    return cleaned_focus_areas[:3]


def build_error_response(
    *,
    status_code: int,
    message: str,
    details: Any = None,
) -> JSONResponse:
    payload = {
        "success": False,
        "error": {
            "code": status_code,
            "message": message,
        },
    }

    if details is not None:
        payload["error"]["details"] = details

    return JSONResponse(status_code=status_code, content=payload)


def format_validation_errors(errors: list[dict[str, Any]]) -> list[dict[str, str]]:
    formatted_errors: list[dict[str, str]] = []

    for error in errors:
        location = [str(part) for part in error.get("loc", []) if str(part) != "body"]
        field_name = ".".join(location) if location else "request"
        formatted_errors.append(
            {
                "field": field_name,
                "message": str(error.get("msg", "Invalid value.")),
            }
        )

    return formatted_errors


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    return build_error_response(
        status_code=exc.status_code,
        message=str(exc.detail),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return build_error_response(
        status_code=422,
        message="Please check the request fields and try again.",
        details=format_validation_errors(exc.errors()),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return build_error_response(
        status_code=500,
        message=str(exc) or "Unexpected server error.",
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="placeprep-coding-ml")


@app.post("/coding/recommend", response_model=CodingRecommendationResponse)
def coding_recommend(payload: CodingRecommendRequest) -> CodingRecommendationResponse:
    try:
        result = recommend_next_question(
            user_id=payload.user_id,
            target_company=payload.target_company,
        )
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    return CodingRecommendationResponse(
        user_id=result["user_id"],
        target_company=result["target_company"],
        focus_topic=result["focus_topic"],
        primary_question=CodingQuestionResponse(**result["primary_question"]),
        easier_questions=[CodingQuestionResponse(**question) for question in result["easier_questions"]],
        harder_questions=[CodingQuestionResponse(**question) for question in result["harder_questions"]],
        similar_questions=[CodingQuestionResponse(**question) for question in result["similar_questions"]],
        reason=result["reason"],
    )


@app.post("/coding/hint", response_model=HintResponse)
def coding_hint(payload: HintRequest) -> HintResponse:
    questions = load_questions()
    question_lookup = get_question_lookup(questions)
    question = question_lookup.get(payload.question_id)

    if question is None:
        raise HTTPException(status_code=404, detail="Question id was not found in the coding question bank.")

    attempts = load_attempts()
    recent_attempts = get_recent_attempts_for_user(
        payload.user_id,
        attempts,
        question_id=payload.question_id,
        limit=3,
    )

    static_hint = get_static_hint(question, payload.hint_level)
    if not groq_client.is_available:
        return HintResponse(
            hint=static_hint,
            hint_level=payload.hint_level,
            source="static",
        )

    groq_hint = groq_client.create_text_completion(
        system_prompt=build_hint_system_prompt(),
        user_prompt=build_hint_user_prompt(
            question=question,
            user_id=payload.user_id,
            status=payload.status,
            hint_level=payload.hint_level,
            recent_attempts=recent_attempts,
        ),
        temperature=0.3,
        max_tokens=120,
    )

    return HintResponse(
        hint=groq_hint or static_hint,
        hint_level=payload.hint_level,
        source="groq" if groq_hint else "static",
    )


@app.post("/coding/explain", response_model=ExplainResponse)
def coding_explain(payload: ExplainRequest) -> ExplainResponse:
    questions = load_questions()
    question_lookup = get_question_lookup(questions)
    question = question_lookup.get(payload.question_id)

    if question is None:
        raise HTTPException(status_code=404, detail="Question id was not found in the coding question bank.")

    attempts = load_attempts()
    topic = normalize_topic(str(question.get("topic", "")))
    recent_topic_attempts = get_recent_attempts_for_user(
        payload.user_id,
        attempts,
        topic=topic,
        limit=5,
    )

    fallback_response = build_fallback_explanation(
        question=question,
        status=payload.status,
        time_spent_min=payload.time_spent_min,
        hints_used=payload.hints_used,
        confidence=payload.confidence,
    )

    if not groq_client.is_available:
        return fallback_response

    groq_response = groq_client.create_json_completion(
        system_prompt=build_explain_system_prompt(),
        user_prompt=build_explain_user_prompt(
            question=question,
            user_id=payload.user_id,
            status=payload.status,
            time_spent_min=payload.time_spent_min,
            hints_used=payload.hints_used,
            confidence=payload.confidence,
            recent_topic_attempts=recent_topic_attempts,
        ),
        temperature=0.2,
        max_tokens=220,
    )

    if not groq_response:
        return fallback_response

    explanation = str(groq_response.get("explanation", "")).strip()
    focus_areas = sanitize_focus_areas(groq_response.get("focus_areas"))

    if not explanation or len(focus_areas) < 2:
        return fallback_response

    return ExplainResponse(
        explanation=explanation,
        focus_areas=focus_areas,
        source="groq",
    )


@app.post("/coding/attempt", response_model=CodingAttemptResponse)
def coding_attempt(payload: CodingAttemptRequest) -> CodingAttemptResponse:
    questions = load_questions()
    question_lookup = get_question_lookup(questions)
    question = question_lookup.get(payload.question_id)

    if question is None:
        raise HTTPException(status_code=404, detail="Question id was not found in the coding question bank.")

    attempt_record = {
        "user_id": payload.user_id,
        "question_id": payload.question_id,
        "topic": normalize_topic(str(question.get("topic", ""))),
        "difficulty": int(question.get("difficulty", 2) or 2),
        "status": payload.status,
        "time_spent_min": payload.time_spent_min,
        "hints_used": payload.hints_used,
        "confidence": payload.confidence,
        "attempted_at": datetime.now().astimezone().isoformat(),
    }
    stored_attempt = append_attempt(attempt_record)

    return CodingAttemptResponse(
        success=True,
        message="Coding attempt stored successfully.",
        attempt=CodingAttemptRecord(**stored_attempt),
    )


@app.get("/coding/user-stats", response_model=CodingUserStatsResponse)
def coding_user_stats(user_id: str = Query(..., min_length=1)) -> CodingUserStatsResponse:
    questions = load_questions()
    attempts = load_attempts()
    topic_stats = compute_topic_stats(user_id, attempts, questions)
    summary = build_user_summary(user_id, attempts, topic_stats)

    return CodingUserStatsResponse(
        user_id=user_id,
        summary=CodingUserSummaryResponse(**summary),
        topic_stats=topic_stats,
    )
