from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from coding.engine.performance_tracker import (
    compute_topic_scores,
    get_weak_topics,
    update_user_performance,
)
from coding.engine.recommendation import get_next_question_recommendation
from coding.engine.variant_generator import generate_question_variants
from coding.models.schemas import (
    CodingHealthResponse,
    GenerateVariantsRequest,
    GenerateVariantsResponse,
    NextQuestionRequest,
    NextQuestionResponse,
    UpdatePerformanceRequest,
    UpdatePerformanceResponse,
)
from coding.utils.helpers import load_json_data


APP_ROOT = Path(__file__).resolve().parents[1]
QUESTIONS_PATH = APP_ROOT / "data" / "questions.json"
USER_PERFORMANCE_PATH = APP_ROOT / "data" / "user_performance.json"

app = FastAPI(title="PlacePrep Coding Recommendation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=CodingHealthResponse)
async def health() -> CodingHealthResponse:
    questions = load_json_data(QUESTIONS_PATH, default=[])
    performance = load_json_data(USER_PERFORMANCE_PATH, default=[])
    return CodingHealthResponse(
        status="ok",
        questions_loaded=len(questions),
        performance_records=len(performance),
    )


@app.post("/coding/next-question", response_model=NextQuestionResponse)
async def next_question(payload: NextQuestionRequest) -> NextQuestionResponse:
    try:
        question, reason, topic_scores = get_next_question_recommendation(
            user_id=payload.user_id,
            preferred_topic=payload.preferred_topic,
            preferred_difficulty=payload.preferred_difficulty,
            questions_path=QUESTIONS_PATH,
            performance_path=USER_PERFORMANCE_PATH,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    weak_topics = get_weak_topics(payload.user_id, USER_PERFORMANCE_PATH)
    return NextQuestionResponse(
        question=question,
        reason=reason,
        weak_topics=weak_topics,
        topic_scores=topic_scores,
    )


@app.post("/coding/update-performance", response_model=UpdatePerformanceResponse)
async def update_performance(payload: UpdatePerformanceRequest) -> UpdatePerformanceResponse:
    try:
        stored_record = update_user_performance(payload.model_dump(), USER_PERFORMANCE_PATH)
        topic_scores = compute_topic_scores(payload.user_id, USER_PERFORMANCE_PATH)
        weak_topics = get_weak_topics(payload.user_id, USER_PERFORMANCE_PATH)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    return UpdatePerformanceResponse(
        success=True,
        message="Performance updated successfully.",
        stored_record=stored_record,
        weak_topics=weak_topics,
        topic_scores=topic_scores,
    )


@app.post("/coding/generate-variants", response_model=GenerateVariantsResponse)
async def generate_variants(payload: GenerateVariantsRequest) -> GenerateVariantsResponse:
    try:
        source_question, variants = generate_question_variants(payload.question_id, QUESTIONS_PATH)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    return GenerateVariantsResponse(
        source_question=source_question,
        variants=variants,
    )
