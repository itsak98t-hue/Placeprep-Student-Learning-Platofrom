from __future__ import annotations

import logging
import random
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("placeprep_ml_api")

MODEL_PATH = ROOT_DIR / "models" / "behavioral_model.joblib"
VECTORIZER_PATH = ROOT_DIR / "models" / "vectorizer.joblib"
USE_ML = False

STAR_SIGNAL_PHRASES = (
    "situation",
    "task",
    "action",
    "result",
    "responsible",
    "challenge",
    "deadline",
    "learned",
    "since then",
)

LEARNING_PHRASES = (
    "i learned",
    "i realised",
    "i realized",
    "since then",
    "after that",
    "this taught me",
    "i changed",
    "i now",
)

ACTION_VERBS = {
    "analyzed",
    "built",
    "changed",
    "communicated",
    "delayed",
    "estimated",
    "faced",
    "led",
    "organized",
    "improved",
    "solved",
    "created",
    "implemented",
    "fixed",
    "coordinated",
    "communicated",
    "designed",
    "planned",
    "owned",
    "drove",
    "resolved",
    "handled",
    "delivered",
    "launched",
    "debugged",
    "prioritized",
    "aligned",
    "negotiated",
    "reviewed",
    "mentored",
    "test",
    "tested",
    "took",
    "underestimated",
    "explained",
    "reduced",
    "increased",
    "shipped",
}

COMMON_NOUNS = {
    "project",
    "team",
    "deadline",
    "manager",
    "customer",
    "client",
    "feature",
    "system",
    "service",
    "internship",
    "college",
    "issue",
    "problem",
    "bug",
    "conflict",
    "mistake",
    "failure",
    "result",
    "outcome",
    "impact",
    "process",
    "workflow",
    "stakeholder",
    "release",
    "testing",
}

STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "because",
    "but",
    "by",
    "for",
    "from",
    "had",
    "has",
    "have",
    "i",
    "in",
    "into",
    "is",
    "it",
    "my",
    "of",
    "on",
    "or",
    "our",
    "so",
    "that",
    "the",
    "their",
    "them",
    "then",
    "there",
    "they",
    "this",
    "to",
    "was",
    "we",
    "were",
    "with",
    "you",
    "your",
}

RESULT_PHRASES = (
    "as a result",
    "result",
    "outcome",
    "therefore",
    "this helped",
    "this improved",
    "we achieved",
    "which led to",
    "which reduced",
    "which increased",
    "so that",
)

OWNERSHIP_PHRASES = (
    "i",
    "my",
    "me",
    "i was responsible",
    "i took ownership",
    "i decided",
    "i led",
    "i drove",
)

NOISE_TOKENS = {
    "asd",
    "asdf",
    "qwe",
    "qwer",
    "zxc",
    "zxczxc",
    "abc",
    "abcd",
    "lorem",
    "ipsum",
    "blah",
}

CORE_MEANINGFUL_WORDS = {
    "i",
    "my",
    "me",
    "team",
    "project",
    "deadline",
    "customer",
    "user",
    "manager",
    "mentor",
    "stakeholder",
    "internship",
    "college",
    "feature",
    "service",
    "system",
    "backend",
    "frontend",
    "bug",
    "problem",
    "issue",
    "conflict",
    "failure",
    "mistake",
    "learning",
    "learned",
    "result",
    "outcome",
    "impact",
    "improved",
    "fixed",
    "launched",
    "owned",
    "responsible",
}.union(ACTION_VERBS)

WEAK_RESPONSE_DEFAULTS = {
    "specific situation",
    "actions you personally took",
    "clear result",
    "lesson learned",
}


class PredictRequest(BaseModel):
    question: str = Field(..., min_length=3)
    answer: str = Field(..., min_length=3)


class PredictResponse(BaseModel):
    label: str
    display_label: str
    confidence: float
    class_probabilities: dict[str, float]
    score_clarity: int
    score_structure: int
    score_impact: int
    missing: list[str]
    feedback: str
    suggested_improvement: str
    interpretation: str
    is_invalid_answer: bool = False
    validation_message: str | None = None


app = FastAPI(
    title="PlacePrep Behavioral Evaluation API",
    version="1.0.0",
    description="Behavioral interview answer evaluation API for PlacePrep",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://placeprep-fa12f.web.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
vectorizer = None
vectorizer_vocab: set[str] = set()


@app.on_event("startup")
def load_artifacts() -> None:
    global model, vectorizer, vectorizer_vocab

    logger.info("Loading model artifacts from disk.")

    if not MODEL_PATH.exists():
        raise RuntimeError(f"Model file not found: {MODEL_PATH}")

    if not VECTORIZER_PATH.exists():
        raise RuntimeError(f"Vectorizer file not found: {VECTORIZER_PATH}")

    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    vectorizer_vocab = set(getattr(vectorizer, "vocabulary_", {}).keys())

    logger.info("Behavioral evaluation artifacts loaded and ready.")


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "vectorizer_loaded": vectorizer is not None,
        "model_path": str(MODEL_PATH),
        "vectorizer_path": str(VECTORIZER_PATH),
    }


def normalize_text(text: str) -> str:
    return " ".join(text.strip().split())


def tokenize_words(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z']+", text.lower())


def split_sentences(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"[.!?]+", text) if part.strip()]


def clamp_score(value: float, minimum: int = 1, maximum: int = 10) -> int:
    return max(minimum, min(maximum, int(round(value))))


def safe_round_probs(labels: list[str], probs: list[float]) -> dict[str, float]:
    result = {label: round(float(prob), 4) for label, prob in zip(labels, probs)}
    for expected in ["weak", "average", "strong"]:
        result.setdefault(expected, 0.0)
    return result


def normalize_probabilities(probs: dict[str, float]) -> dict[str, float]:
    total = sum(max(0.0, float(probs.get(label, 0.0))) for label in ("weak", "average", "strong"))
    if total <= 0:
        return {"weak": 0.33, "average": 0.34, "strong": 0.33}

    normalized = {
        label: max(0.0, float(probs.get(label, 0.0))) / total
        for label in ("weak", "average", "strong")
    }
    return {label: round(value, 4) for label, value in normalized.items()}


def derive_display_label(label: str, probs: dict[str, float]) -> str:
    weak_prob = float(probs.get("weak", 0.0))
    average_prob = float(probs.get("average", 0.0))
    strong_prob = float(probs.get("strong", 0.0))

    if label == "average":
        if strong_prob >= 0.40 and (average_prob - strong_prob) <= 0.05:
            return "almost_strong"
        if weak_prob >= 0.32 and (average_prob - weak_prob) <= 0.08:
            return "borderline_average"
        return "average"

    if label == "strong":
        if average_prob >= 0.32 and (strong_prob - average_prob) <= 0.08:
            return "borderline_strong"
        return "strong"

    return "weak"


def is_suspicious_token(token: str) -> bool:
    lowered = token.lower()
    vowels = sum(1 for char in lowered if char in "aeiou")
    consonants = sum(1 for char in lowered if char.isalpha() and char not in "aeiou")

    if lowered in NOISE_TOKENS:
        return True
    if len(lowered) >= 6 and vowels == 0:
        return True
    if len(lowered) >= 5 and len(set(lowered)) <= 2:
        return True
    if re.fullmatch(r"(.)\1{3,}", lowered):
        return True
    if len(lowered) >= 7 and consonants / max(1, len(lowered)) >= 0.85:
        return True
    return False


def is_meaningful_token(token: str) -> bool:
    lowered = token.lower()
    if lowered in CORE_MEANINGFUL_WORDS or lowered in vectorizer_vocab:
        return True
    if is_suspicious_token(lowered):
        return False
    if lowered in {"i", "me", "my", "we", "our"}:
        return True
    return len(lowered) >= 4 and any(char in "aeiou" for char in lowered)


def extract_answer_features(answer: str) -> dict[str, Any]:
    normalized_answer = normalize_text(answer)
    answer_lower = normalized_answer.lower()
    tokens = tokenize_words(normalized_answer)
    token_counts = Counter(tokens)
    sentences = split_sentences(answer)
    word_count = len(tokens)
    sentence_count = len(sentences)
    punctuation_count = len(re.findall(r"[,.!?;:]", answer))
    repeated_count = sum(max(count - 1, 0) for count in token_counts.values())
    long_word_count = sum(1 for token in tokens if len(token) >= 7)
    suspicious_count = sum(1 for token in tokens if is_suspicious_token(token))
    meaningful_count = sum(1 for token in tokens if is_meaningful_token(token))
    action_hits = sum(
        1
        for token in tokens
        if token in ACTION_VERBS or (len(token) > 4 and token.endswith("ed"))
    )
    noun_hits = sum(
        1
        for token in tokens
        if token in COMMON_NOUNS or (len(token) >= 5 and token not in ACTION_VERBS and token not in STOPWORDS)
    )
    ownership_count = sum(1 for token in tokens if token in {"i", "my", "me"})
    star_signal_count = sum(1 for phrase in STAR_SIGNAL_PHRASES if phrase in answer_lower)

    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "avg_sentence_length": round(word_count / max(sentence_count, 1), 2) if word_count else 0.0,
        "unique_word_ratio": round(len(token_counts) / max(word_count, 1), 3) if word_count else 0.0,
        "repeated_word_ratio": round(repeated_count / max(word_count, 1), 3) if word_count else 0.0,
        "long_word_ratio": round(long_word_count / max(word_count, 1), 3) if word_count else 0.0,
        "punctuation_count": punctuation_count,
        "has_star_signals": star_signal_count > 0,
        "star_signal_count": star_signal_count,
        "has_learning_signal": any(phrase in answer_lower for phrase in LEARNING_PHRASES),
        "has_action_signal": action_hits > 0 or any(f"i {verb}" in answer_lower for verb in ACTION_VERBS),
        "has_result_signal": any(phrase in answer_lower for phrase in RESULT_PHRASES),
        "has_numbers": bool(re.search(r"\b\d+[%xX]?\b", answer_lower)),
        "gibberish_ratio": round(suspicious_count / max(word_count, 1), 3) if word_count else 1.0,
        "meaningful_token_ratio": round(meaningful_count / max(word_count, 1), 3) if word_count else 0.0,
        "ownership_count": ownership_count,
        "action_count": action_hits,
        "noun_count": noun_hits,
        "has_verb_signal": action_hits > 0,
        "has_noun_signal": noun_hits > 0,
        "has_repeated_characters": bool(re.search(r"(.)\1{3,}", answer_lower)),
        "tokens": tokens,
    }


def extract_question_keywords(question: str) -> set[str]:
    tokens = tokenize_words(question)
    keywords = {
        token
        for token in tokens
        if len(token) >= 4 and token not in STOPWORDS and not is_suspicious_token(token)
    }
    return keywords


def get_question_relevance(answer_tokens: list[str], question_keywords: set[str]) -> float:
    if not question_keywords:
        return 0.5

    overlap = sum(1 for token in set(answer_tokens) if token in question_keywords)
    return round(overlap / max(1, len(question_keywords)), 3)


def isGibberish(text: str) -> bool:
    return validate_answer_text(text)["is_invalid"]


def validate_answer_text(text: str) -> dict[str, Any]:
    normalized_text = normalize_text(text)
    features = extract_answer_features(normalized_text)
    word_count = int(features["word_count"])
    gibberish_ratio = float(features["gibberish_ratio"])
    meaningful_token_ratio = float(features["meaningful_token_ratio"])
    repeated_word_ratio = float(features["repeated_word_ratio"])

    # Hard gibberish rule from product spec.
    if gibberish_ratio > 0.5 or meaningful_token_ratio < 0.3:
        return {
            "is_invalid": True,
            "reason": "hard_gibberish",
            "message": "Answer is not meaningful. Please provide a structured response.",
            "features": features,
        }

    # Critical early-return validation layer.
    if word_count < 15:
        return {
            "is_invalid": True,
            "reason": "too_short",
            "message": "Answer is too short. Please provide a fuller structured response.",
            "features": features,
        }

    if gibberish_ratio > 0.4:
        return {
            "is_invalid": True,
            "reason": "high_gibberish",
            "message": "Answer is not meaningful. Please provide a clear response.",
            "features": features,
        }

    if meaningful_token_ratio < 0.4:
        return {
            "is_invalid": True,
            "reason": "low_meaningfulness",
            "message": "Answer is not meaningful. Please provide a clear response.",
            "features": features,
        }

    if repeated_word_ratio > 0.4 or bool(features["has_repeated_characters"]):
        return {
            "is_invalid": True,
            "reason": "repeated_words",
            "message": "Answer is too repetitive. Please provide a structured response.",
            "features": features,
        }

    return {
        "is_invalid": False,
        "reason": None,
        "message": None,
        "features": features,
    }


def detect_override_reason(features: dict[str, Any]) -> str | None:
    word_count = int(features["word_count"])
    gibberish_ratio = float(features["gibberish_ratio"])
    meaningful_ratio = float(features["meaningful_token_ratio"])
    repeated_ratio = float(features["repeated_word_ratio"])
    has_action_signal = bool(features["has_action_signal"])
    has_learning_signal = bool(features["has_learning_signal"])
    has_result_signal = bool(features["has_result_signal"])

    if word_count < 12:
        return "too_short"
    if gibberish_ratio >= 0.45:
        return "high_gibberish"
    if meaningful_ratio <= 0.35:
        return "low_meaningfulness"
    if repeated_ratio >= 0.5:
        return "high_repetition"
    if not has_action_signal and not has_learning_signal and not has_result_signal and word_count < 20:
        return "no_behavioral_signal"
    return None


def derive_weak_validation_scores(reason: str, features: dict[str, Any]) -> tuple[int, int, int]:
    if reason in {"hard_gibberish", "high_gibberish"}:
        return 1, 1, 1
    if reason == "low_meaningfulness":
        return 2, 1, 1
    if reason == "repeated_words":
        return 2, 2, 1
    if reason == "too_short":
        if int(features["word_count"]) < 8:
            return 1, 1, 1
        return 2, 2, 1
    return 2, 2, 1


def derive_ml_scores(label: str, probs: dict[str, float]) -> tuple[int, int, int]:
    weak_prob = float(probs.get("weak", 0.0))
    average_prob = float(probs.get("average", 0.0))
    strong_prob = float(probs.get("strong", 0.0))

    clarity = (weak_prob * 3.0) + (average_prob * 5.5) + (strong_prob * 8.4)
    structure = (weak_prob * 2.6) + (average_prob * 5.4) + (strong_prob * 8.5)
    impact = (weak_prob * 2.0) + (average_prob * 5.0) + (strong_prob * 8.8)

    if label == "strong":
        structure += 0.3
        impact += 0.2
    elif label == "weak":
        clarity -= 0.2
        impact -= 0.3

    return clamp_score(clarity), clamp_score(structure), clamp_score(impact)


def derive_heuristic_scores(features: dict[str, Any], question_relevance: float) -> tuple[int, int, int]:
    word_count = int(features["word_count"])
    sentence_count = int(features["sentence_count"])
    avg_sentence_length = float(features["avg_sentence_length"])
    unique_ratio = float(features["unique_word_ratio"])
    repeated_ratio = float(features["repeated_word_ratio"])
    meaningful_ratio = float(features["meaningful_token_ratio"])
    gibberish_ratio = float(features["gibberish_ratio"])
    punctuation_count = int(features["punctuation_count"])
    ownership_count = int(features["ownership_count"])

    clarity = 1.0
    if word_count >= 12:
        clarity += 1.0
    if word_count >= 20:
        clarity += 1.0
    if word_count >= 35:
        clarity += 1.0
    if word_count >= 55:
        clarity += 1.0
    if sentence_count >= 2:
        clarity += 1.0
    if sentence_count >= 3:
        clarity += 1.0
    if 5 <= avg_sentence_length <= 26:
        clarity += 1.0
    if meaningful_ratio >= 0.55:
        clarity += 1.0
    if meaningful_ratio >= 0.78:
        clarity += 1.0
    if unique_ratio >= 0.62:
        clarity += 1.0
    if punctuation_count >= 1:
        clarity += 0.5
    if question_relevance >= 0.2:
        clarity += 0.5
    if question_relevance >= 0.4:
        clarity += 0.5
    if repeated_ratio >= 0.35:
        clarity -= 1.0
    if gibberish_ratio >= 0.25:
        clarity -= 2.0

    structure = 1.0
    if sentence_count >= 2:
        structure += 1.0
    if word_count >= 18:
        structure += 1.0
    if features["has_star_signals"]:
        structure += 2.0
    if features["star_signal_count"] >= 2:
        structure += 1.0
    if features["has_action_signal"]:
        structure += 2.0
    if features["has_result_signal"]:
        structure += 2.0
    if features["has_learning_signal"]:
        structure += 1.0
    if question_relevance >= 0.25:
        structure += 0.5
    if punctuation_count >= 2:
        structure += 0.5
    if repeated_ratio >= 0.4:
        structure -= 1.0
    if gibberish_ratio >= 0.25:
        structure -= 1.5

    impact = 1.0
    if features["has_action_signal"]:
        impact += 1.0
    if ownership_count >= 2:
        impact += 1.0
    if word_count >= 25:
        impact += 1.0
    if features["has_result_signal"]:
        impact += 2.0
    if features["has_numbers"]:
        impact += 2.0
    if features["has_learning_signal"]:
        impact += 1.0
    if features["has_star_signals"]:
        impact += 1.0
    if question_relevance >= 0.25:
        impact += 0.5
    if question_relevance >= 0.45:
        impact += 0.5
    if repeated_ratio >= 0.45:
        impact -= 1.0
    if gibberish_ratio >= 0.25:
        impact -= 1.0
    if not features["has_result_signal"]:
        impact -= 1.0

    return clamp_score(clarity), clamp_score(structure), clamp_score(impact)


def calculate_rule_based_final_score(
    features: dict[str, Any],
    question_relevance: float,
) -> tuple[int, int, int, int]:
    clarity = 0.0
    structure = 0.0
    impact = 0.0

    word_count = int(features["word_count"])
    sentence_count = int(features["sentence_count"])
    meaningful_ratio = float(features["meaningful_token_ratio"])
    gibberish_ratio = float(features["gibberish_ratio"])

    # Clarity (0-3)
    if word_count >= 20:
        clarity += 1.0
    if sentence_count >= 2:
        clarity += 1.0
    if meaningful_ratio >= 0.6 and gibberish_ratio < 0.2:
        clarity += 1.0

    # Structure (0-3)
    if bool(features["has_star_signals"]):
        structure += 2.0
    if sentence_count >= 3 or question_relevance >= 0.25:
        structure += 1.0

    # Impact (0-4)
    if bool(features["has_action_signal"]):
        impact += 1.0
    if int(features["ownership_count"]) >= 2:
        impact += 1.0
    if bool(features["has_result_signal"]):
        impact += 2.0
    if bool(features["has_learning_signal"]):
        impact += 1.0

    raw_total = clarity + structure + impact
    noise = random.uniform(-0.3, 0.3)
    final_score = clamp_score(raw_total + noise)

    return clamp_score(clarity, 0, 3), clamp_score(structure, 0, 3), clamp_score(impact, 0, 4), final_score


def derive_override_scores(reason: str, features: dict[str, Any]) -> tuple[int, int, int]:
    if reason == "high_gibberish":
        return 1, 1, 1
    if reason == "low_meaningfulness":
        return 2, 1, 1
    if reason == "high_repetition":
        return 2, 2, 1
    if reason == "no_behavioral_signal":
        return 2, 2, 1
    if int(features["word_count"]) < 8:
        return 2, 1, 1
    return 3, 3, 2


def derive_label_from_scores(score_clarity: int, score_structure: int, score_impact: int) -> str:
    weighted_total = score_clarity + score_structure + score_impact
    if weighted_total <= 3:
        return "weak"
    if weighted_total <= 7:
        return "average"
    return "strong"


def derive_heuristic_probabilities(score_clarity: int, score_structure: int, score_impact: int) -> dict[str, float]:
    average_score = (score_clarity + score_structure + score_impact) / 3
    if average_score < 4.0:
        weak = min(0.9, 0.62 + ((4.0 - average_score) * 0.12))
        strong = 0.03
        average = max(0.07, 1.0 - weak - strong)
    elif average_score < 7.0:
        average = min(0.82, 0.55 + ((average_score - 4.0) * 0.09))
        weak = max(0.08, 0.28 - ((average_score - 4.0) * 0.06))
        strong = max(0.06, 1.0 - average - weak)
    else:
        strong = min(0.9, 0.58 + ((average_score - 7.0) * 0.12))
        weak = 0.03
        average = max(0.07, 1.0 - strong - weak)

    return normalize_probabilities({"weak": weak, "average": average, "strong": strong})


def blend_probabilities(
    ml_probabilities: dict[str, float] | None,
    heuristic_probabilities: dict[str, float],
    override_reason: str | None,
) -> dict[str, float]:
    if override_reason or not ml_probabilities:
        return heuristic_probabilities

    blended = {
        label: (heuristic_probabilities[label] * 0.65) + (ml_probabilities.get(label, 0.0) * 0.35)
        for label in ("weak", "average", "strong")
    }
    return normalize_probabilities(blended)


def derive_missing_points(
    score_structure: int,
    score_impact: int,
    features: dict[str, Any],
    override_reason: str | None,
) -> list[str]:
    missing: list[str] = []

    if override_reason:
        missing.extend([
            "specific situation",
            "actions you personally took",
            "clear result",
            "lesson learned",
        ])

    if int(features["word_count"]) < 18:
        missing.append("more specific detail")
    if score_structure < 5:
        missing.append("clear situation, action, and result flow")
    if not features["has_action_signal"] or int(features["ownership_count"]) < 2:
        missing.append("your personal contribution")
    if score_impact < 5 or not features["has_result_signal"] or not features["has_numbers"]:
        missing.append("stronger outcome or measurable result")
    if not features["has_learning_signal"]:
        missing.append("what you learned and what changed afterward")

    deduped: list[str] = []
    for item in missing:
        if item not in deduped:
            deduped.append(item)

    if not deduped:
        return []

    return deduped[:4]


def build_feedback(
    label: str,
    score_clarity: int,
    score_structure: int,
    score_impact: int,
    features: dict[str, Any],
    override_reason: str | None,
    question_relevance: float,
) -> tuple[str, str]:
    weakest_dimension = min(
        ("clarity", score_clarity),
        ("structure", score_structure),
        ("impact", score_impact),
        key=lambda item: item[1],
    )[0]

    if override_reason == "high_gibberish" or float(features["gibberish_ratio"]) >= 0.45:
        return (
            "This answer does not read like a clear behavioral example yet. It needs a real situation, your actions, and a concrete result.",
            "Rewrite it as a short STAR story with one specific situation, what you did, and what happened in the end.",
        )

    if override_reason == "too_short":
        return (
            "This answer is too brief to show your thinking clearly. Right now it hints at the story, but it does not give enough detail to score well.",
            "Expand it into 3 to 5 sentences covering the situation, your actions, the result, and what you learned.",
        )

    if question_relevance < 0.16:
        return (
            "The answer includes some meaningful content, but it does not feel tightly connected to what the question is asking yet.",
            "Anchor the story more directly to the prompt and make the challenge you faced clearer.",
        )

    if label == "weak":
        if weakest_dimension == "clarity":
            return (
                "The answer is understandable in places, but it still feels vague and under-explained. The interviewer would struggle to picture the real situation.",
                "Open with one direct sentence that sets the context before you describe what you did.",
            )
        if weakest_dimension == "structure":
            return (
                "The main issue is structure. The story does not yet flow cleanly from situation to action to result, so the answer feels incomplete.",
                "Rebuild it in STAR order so the interviewer can follow the sequence without guessing.",
            )
        return (
            "The answer needs a stronger ending. It mentions effort, but it does not yet show a convincing outcome or the impact of your contribution.",
            "Add the outcome, the change you caused, and one measurable or concrete result if possible.",
        )

    if label == "average":
        if weakest_dimension == "clarity":
            return (
                "This is a reasonable answer, but some parts are still too generic. A little more context and precision would make it feel more polished.",
                "Clarify the setting, the challenge, and one or two concrete details so the story feels specific.",
            )
        if weakest_dimension == "structure":
            return (
                "This answer has the right ingredients, but the flow is compressed. A clearer STAR sequence would make it much easier to follow.",
                "Separate the situation, your action, and the final result more explicitly.",
            )
        return (
            "This answer is solid, but the impact is still softer than it could be. The story would land better with a sharper outcome or reflection.",
            "Finish with what changed because of your actions and what you learned from it.",
        )

    praise_parts = []
    if features["has_action_signal"] and int(features["ownership_count"]) >= 2:
        praise_parts.append("strong ownership")
    if features["has_star_signals"] or score_structure >= 8:
        praise_parts.append("clear structure")
    if features["has_learning_signal"]:
        praise_parts.append("useful reflection")
    if features["has_result_signal"]:
        praise_parts.append("a believable result")

    praise_text = ", ".join(praise_parts[:3]) if praise_parts else "clear behavioral depth"
    return (
        f"This is a strong answer. It shows {praise_text}, which makes it sound interview-ready rather than generic.",
        "To push it even higher, tighten one sentence and make the result even more concrete or measurable.",
    )


def build_interpretation(label: str, score_clarity: int, score_structure: int, score_impact: int) -> str:
    average_score = (score_clarity + score_structure + score_impact) / 3

    if label == "weak":
        if average_score <= 2.0:
            return "Clearly weak"
        return "Weak, but recoverable with a fuller STAR example"

    if label == "average":
        if average_score >= 6.3:
            return "High average and close to strong"
        if average_score <= 4.5:
            return "Low average with obvious room to improve"
        return "Solid average"

    if average_score >= 8.5:
        return "Clearly strong"
    return "Strong and interview-ready"


def build_fallback_response() -> PredictResponse:
    logger.warning("Returning behavioral fallback response.", extra={"fallback_generated": True})
    fallback_probabilities = {"weak": 0.2, "average": 0.6, "strong": 0.2}
    return PredictResponse(
        label="average",
        display_label="average",
        confidence=0.0,
        class_probabilities=fallback_probabilities,
        score_clarity=5,
        score_structure=5,
        score_impact=5,
        missing=["specific situation", "actions you personally took", "clear result"],
        feedback="We couldn't fully evaluate this answer. Please try again.",
        suggested_improvement="Try again with a fuller STAR answer that includes your action and the final result.",
        interpretation="Fallback response generated",
        is_invalid_answer=False,
        validation_message=None,
    )


def build_invalid_answer_response(message: str, reason: str) -> PredictResponse:
    logger.info(
        "behavioral_predict_invalid reason=%s message=%s",
        reason,
        message,
    )
    return PredictResponse(
        label="weak",
        display_label="weak",
        confidence=1.0,
        class_probabilities={"weak": 1.0, "average": 0.0, "strong": 0.0},
        score_clarity=1,
        score_structure=1,
        score_impact=1,
        missing=["specific situation", "actions you personally took", "clear result", "lesson learned"],
        feedback=message,
        suggested_improvement="Write a clear STAR-style response with a specific situation, your action, and the result.",
        interpretation="Invalid answer input detected",
        is_invalid_answer=True,
        validation_message=message,
    )


def evaluate_submission(question: str, answer: str) -> PredictResponse:
    if vectorizer is None:
        raise RuntimeError("Vectorizer is not loaded.")

    normalized_question = normalize_text(question)
    normalized_answer = normalize_text(answer)
    validation = validate_answer_text(normalized_answer)
    answer_features = validation["features"]
    question_keywords = extract_question_keywords(normalized_question)
    question_relevance = get_question_relevance(answer_features["tokens"], question_keywords)
    print("FEATURES:", {key: value for key, value in answer_features.items() if key != "tokens"})

    if validation["is_invalid"]:
        weak_scores = derive_weak_validation_scores(validation["reason"], answer_features)
        print("FINAL SCORE:", 1)
        logger.info(
            "behavioral_predict_debug answer=%s features=%s relevance=%s final_label=%s override=%s invalid=%s",
            normalized_answer[:160],
            {
                key: value
                for key, value in answer_features.items()
                if key != "tokens"
            },
            question_relevance,
            "weak",
            validation["reason"],
            True,
        )
        response = build_invalid_answer_response(validation["message"], validation["reason"])
        response.score_clarity = weak_scores[0]
        response.score_structure = weak_scores[1]
        response.score_impact = weak_scores[2]
        return response

    override_reason = detect_override_reason(answer_features)

    ml_label: str | None = None
    ml_probabilities: dict[str, float] | None = None
    ml_confidence = 0.0
    ml_scores = (5, 5, 5)

    if USE_ML and model is not None:
        try:
            transformed = vectorizer.transform([normalized_answer])
            ml_label = str(model.predict(transformed)[0])
            probabilities = model.predict_proba(transformed)[0]
            class_labels = [str(label) for label in model.classes_]
            ml_probabilities = safe_round_probs(class_labels, probabilities.tolist())
            ml_confidence = round(float(max(probabilities)), 4)
            ml_scores = derive_ml_scores(ml_label, ml_probabilities)
        except Exception:
            logger.exception("ML prediction step failed; continuing with heuristic scoring only.")
            ml_label = None
            ml_probabilities = None
            ml_confidence = 0.0

    heuristic_scores = derive_heuristic_scores(answer_features, question_relevance)
    rule_clarity, rule_structure, rule_impact, rule_final_score = calculate_rule_based_final_score(
        answer_features,
        question_relevance,
    )

    if override_reason:
        final_scores = derive_override_scores(override_reason, answer_features)
        final_numeric_score = clamp_score(sum(final_scores) / 2)
    elif USE_ML and ml_label is not None:
        final_scores = (
            clamp_score((rule_clarity * 0.7) + (ml_scores[0] * 0.3), 1, 10),
            clamp_score((rule_structure * 0.7) + (ml_scores[1] * 0.3), 1, 10),
            clamp_score((rule_impact * 0.7) + (ml_scores[2] * 0.3), 1, 10),
        )
        final_numeric_score = clamp_score(
            ((final_scores[0] + final_scores[1] + final_scores[2]) / 3) + random.uniform(-0.3, 0.3)
        )
    else:
        final_scores = (rule_clarity, rule_structure, rule_impact)
        final_numeric_score = rule_final_score

    if final_numeric_score <= 3:
        final_label = "weak"
    elif final_numeric_score <= 7:
        final_label = "average"
    else:
        final_label = "strong"
    heuristic_probabilities = derive_heuristic_probabilities(*final_scores)
    final_probabilities = blend_probabilities(ml_probabilities, heuristic_probabilities, override_reason)
    final_confidence = round(float(max(final_probabilities.values())), 4)
    display_label = derive_display_label(final_label, final_probabilities)
    missing = derive_missing_points(final_scores[1], final_scores[2], answer_features, override_reason)
    feedback, suggested_improvement = build_feedback(
        final_label,
        final_scores[0],
        final_scores[1],
        final_scores[2],
        answer_features,
        override_reason,
        question_relevance,
    )
    interpretation = build_interpretation(final_label, *final_scores)
    print("FINAL SCORE:", final_numeric_score)

    logger.info(
        "behavioral_predict_debug answer=%s features=%s relevance=%s ml_label=%s ml_probs=%s heuristic_scores=%s final_scores=%s final_label=%s override=%s invalid=%s",
        normalized_answer[:160],
        {
            key: value
            for key, value in answer_features.items()
            if key != "tokens"
        },
        question_relevance,
        ml_label,
        ml_probabilities,
        {
            "clarity": heuristic_scores[0],
            "structure": heuristic_scores[1],
            "impact": heuristic_scores[2],
        },
        {
            "clarity": final_scores[0],
            "structure": final_scores[1],
            "impact": final_scores[2],
            "final_score": final_numeric_score,
        },
        final_label,
        override_reason or "none",
        False,
    )

    return PredictResponse(
        label=final_label,
        display_label=display_label,
        confidence=final_confidence if ml_label else max(final_confidence, 0.55 if final_label == "weak" else 0.5),
        class_probabilities=final_probabilities,
        score_clarity=final_scores[0],
        score_structure=final_scores[1],
        score_impact=final_scores[2],
        missing=missing,
        feedback=feedback,
        suggested_improvement=suggested_improvement,
        interpretation=interpretation,
        is_invalid_answer=False,
        validation_message=None,
    )


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    if model is None or vectorizer is None:
        raise HTTPException(status_code=500, detail="Model artifacts are not loaded.")

    try:
        return evaluate_submission(payload.question, payload.answer)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Prediction failed.", extra={"fallback_generated": True})
        return build_fallback_response()
