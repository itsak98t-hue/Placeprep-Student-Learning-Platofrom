from __future__ import annotations

import logging
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
from sklearn.metrics.pairwise import cosine_similarity

from api.schemas import DimensionScores, EvaluationBand, EvaluationResponse, EvaluationSignals


logger = logging.getLogger("placeprep_ml_api")

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR.parent / "models"
MODEL_PATH = MODELS_DIR / "behavioral_model.joblib"
VECTORIZER_PATH = MODELS_DIR / "vectorizer.joblib"

MODEL: Any | None = None
VECTORIZER: Any | None = None

STOPWORDS = {
    "a",
    "about",
    "all",
    "am",
    "an",
    "and",
    "any",
    "are",
    "as",
    "at",
    "be",
    "because",
    "been",
    "but",
    "by",
    "did",
    "do",
    "for",
    "from",
    "had",
    "has",
    "have",
    "how",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "me",
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
    "there",
    "they",
    "this",
    "to",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "who",
    "with",
    "would",
    "you",
    "your",
}

FILLER_PATTERNS = (
    "asdf",
    "qwer",
    "zxcv",
    "blah",
    "lorem ipsum",
    "random text",
    "nothing much",
    "something happened",
    "stuff happened",
    "i don't know",
    "dont know",
    "no idea",
    "n/a",
)

GENERIC_PATTERNS = (
    "i worked hard",
    "i did my best",
    "i am a good team player",
    "i always try my best",
    "i completed the task",
    "i solved it",
    "we handled it",
    "it was good",
)

THEME_KEYWORDS: dict[str, set[str]] = {
    "conflict": {"conflict", "disagreement", "argued", "argument", "friction", "teammate", "tension", "misalignment"},
    "leadership": {"lead", "led", "leadership", "guide", "owned", "ownership", "coordinate", "organized", "mentored"},
    "failure": {"failure", "failed", "mistake", "missed", "wrong", "learned", "lesson", "improve"},
    "teamwork": {"team", "teammate", "collaborate", "partner", "cross-functional", "group", "support"},
    "initiative": {"initiative", "proactive", "started", "proposed", "volunteered", "improved", "automated"},
    "pressure": {"pressure", "deadline", "urgent", "rush", "fast", "time", "turnaround"},
    "feedback": {"feedback", "criticism", "review", "input", "coach", "improve"},
    "ambiguity": {"ambiguous", "ambiguity", "unclear", "undefined", "uncertainty", "unknown", "structure"},
    "ownership": {"owned", "ownership", "responsible", "accountable", "drove", "followed", "through"},
}

THEME_HINTS = {
    "conflict": "a disagreement or tension with another teammate",
    "leadership": "a moment where you stepped up and guided people or work",
    "failure": "a real mistake or setback and what you changed afterward",
    "teamwork": "how you collaborated with others to reach a shared outcome",
    "initiative": "a time you proactively improved something without being asked",
    "pressure": "how you handled a tight deadline or stressful situation",
    "feedback": "how you received and acted on difficult feedback",
    "ambiguity": "how you created clarity when the path was not obvious",
    "ownership": "a time you took responsibility end-to-end",
}

ACTION_VERBS = {
    "aligned",
    "analyzed",
    "built",
    "coordinated",
    "created",
    "debugged",
    "decided",
    "defined",
    "designed",
    "documented",
    "drove",
    "fixed",
    "handled",
    "implemented",
    "improved",
    "influenced",
    "launched",
    "led",
    "negotiated",
    "organized",
    "planned",
    "prioritized",
    "proposed",
    "rebuilt",
    "reduced",
    "resolved",
    "reviewed",
    "shipped",
    "spoke",
    "structured",
    "took",
}

ACTION_PHRASES = (
    "i built",
    "i created",
    "i decided",
    "i designed",
    "i drove",
    "i fixed",
    "i handled",
    "i implemented",
    "i improved",
    "i launched",
    "i led",
    "i organized",
    "i prioritized",
    "i proposed",
    "i resolved",
    "i reviewed",
    "i shipped",
    "i spoke",
    "i structured",
    "i took",
)

RESULT_WORDS = {
    "achieved",
    "completed",
    "delivered",
    "grew",
    "helped",
    "improved",
    "increased",
    "launched",
    "outcome",
    "reduced",
    "resolved",
    "result",
    "saved",
}

HEDGE_WORDS = {"maybe", "kind", "sort", "probably", "perhaps", "guess", "somehow", "might"}


def artifacts_ready() -> bool:
    return MODEL_PATH.exists() and VECTORIZER_PATH.exists()


def load_artifacts() -> tuple[Any, Any]:
    global MODEL, VECTORIZER

    if MODEL is not None and VECTORIZER is not None:
        return MODEL, VECTORIZER

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Trained model not found at {MODEL_PATH}. "
            "Make sure behavioral_model.joblib is deployed with the service."
        )

    if not VECTORIZER_PATH.exists():
        raise FileNotFoundError(
            f"Trained vectorizer not found at {VECTORIZER_PATH}. "
            "Make sure vectorizer.joblib is deployed with the service."
        )

    logger.info("Loading model artifacts from disk.")
    MODEL = joblib.load(MODEL_PATH)
    VECTORIZER = joblib.load(VECTORIZER_PATH)
    return MODEL, VECTORIZER


def normalize_text(text: str) -> str:
    return " ".join(text.strip().lower().split())


def tokenize_words(text: str) -> list[str]:
    return re.findall(r"[a-z]+(?:'[a-z]+)?", text.lower())


def split_sentences(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"[.!?]+", text) if part.strip()]


def clamp(value: float, lower: float = 0.0, upper: float = 100.0) -> float:
    return max(lower, min(upper, value))


def round_score(value: float) -> float:
    return round(clamp(value), 1)


def extract_question_keywords(question: str) -> set[str]:
    return {
        token
        for token in tokenize_words(question)
        if token not in STOPWORDS and len(token) > 2
    }


def infer_question_theme(question: str) -> str | None:
    lowered = question.lower()
    best_theme: str | None = None
    best_hits = 0

    for theme, keywords in THEME_KEYWORDS.items():
        hits = sum(1 for keyword in keywords if keyword in lowered)
        if hits > best_hits:
            best_theme = theme
            best_hits = hits

    return best_theme


def has_metric(answer: str) -> bool:
    return bool(re.search(r"\b\d+[%xX]?\b", answer))


def has_first_person_ownership(answer: str) -> bool:
    lowered = f" {answer.lower()} "
    return any(token in lowered for token in (" i ", " i'", " i,", " i.", " my ", " me "))


def has_context(answer: str) -> bool:
    lowered = answer.lower()
    return any(
        marker in lowered
        for marker in (
            "during",
            "when",
            "while",
            "at the time",
            "in my internship",
            "in college",
            "on a project",
            "our team",
            "one quarter",
            "last semester",
            "at my previous",
        )
    )


def has_action(answer: str) -> bool:
    lowered = answer.lower()
    action_hits = sum(1 for phrase in ACTION_PHRASES if phrase in lowered)
    token_hits = sum(1 for token in tokenize_words(answer) if token in ACTION_VERBS)
    return action_hits > 0 or token_hits >= 2


def has_result(answer: str) -> bool:
    lowered = answer.lower()
    return any(word in lowered for word in RESULT_WORDS) or has_metric(answer)


def keyword_overlap(question: str, answer: str) -> float:
    question_keywords = extract_question_keywords(question)
    if not question_keywords:
        return 0.0

    answer_tokens = set(tokenize_words(answer))
    overlap = len(question_keywords & answer_tokens)
    return overlap / len(question_keywords)


def theme_match(question: str, answer: str) -> float:
    theme = infer_question_theme(question)
    if not theme:
        return 0.0

    answer_tokens = set(tokenize_words(answer))
    theme_hits = len(answer_tokens & THEME_KEYWORDS[theme])
    return min(1.0, theme_hits / 3)


def semantic_similarity(question: str, answer: str, vectorizer: Any) -> float:
    if not question or not answer:
        return 0.0

    features = vectorizer.transform([question, answer])
    similarity = cosine_similarity(features[0], features[1])[0][0]
    return float(max(0.0, min(1.0, similarity)))


def detect_gibberish_reason(answer: str) -> str | None:
    tokens = tokenize_words(answer)
    unique_tokens = set(tokens)
    lowered = answer.lower().strip()

    if not tokens:
        return "The answer does not contain enough meaningful language to evaluate."

    if any(pattern in lowered for pattern in FILLER_PATTERNS):
        return "The answer reads like filler text rather than a real behavioral example."

    if re.search(r"([a-z])\1{5,}", lowered):
        return "The answer appears to contain repeated letters rather than meaningful content."

    if re.search(r"\b[bcdfghjklmnpqrstvwxyz]{7,}\b", lowered):
        return "The answer appears to contain gibberish rather than meaningful words."

    if len(tokens) >= 6 and len(unique_tokens) / len(tokens) < 0.32:
        return "The answer is too repetitive to be treated as a meaningful response."

    if len(tokens) >= 8 and max(tokens.count(token) for token in unique_tokens) / len(tokens) > 0.5:
        return "The answer repeats the same words too heavily to show a real example."

    return None


def is_generic_answer(answer: str, tokens: list[str], action_count: int) -> bool:
    lowered = answer.lower()
    concrete_token_hits = sum(
        1
        for token in tokens
        if token in {"team", "project", "deadline", "customer", "user", "mentor", "feature", "client", "stakeholder"}
    )

    if any(pattern in lowered for pattern in GENERIC_PATTERNS):
        return True

    if len(tokens) < 32 and concrete_token_hits == 0 and not has_metric(answer) and not has_result(answer):
        return True

    if action_count < 2 and not has_metric(answer) and concrete_token_hits < 2:
        return True

    return False


def compute_signals(question: str, answer: str, vectorizer: Any) -> EvaluationSignals:
    tokens = tokenize_words(answer)
    sentences = split_sentences(answer)
    gibberish_reason = detect_gibberish_reason(answer)
    keyword_score = keyword_overlap(question, answer)
    theme_score = theme_match(question, answer)
    semantic_score = semantic_similarity(question, answer, vectorizer)
    action_count = sum(1 for token in tokens if token in ACTION_VERBS)

    return EvaluationSignals(
        word_count=len(tokens),
        sentence_count=len(sentences),
        semantic_similarity=round(semantic_score, 3),
        keyword_overlap=round(keyword_score, 3),
        theme_match=round(theme_score, 3),
        has_context=has_context(answer),
        has_action=has_action(answer),
        has_result=has_result(answer),
        has_metrics=has_metric(answer),
        has_first_person=has_first_person_ownership(answer),
        gibberish_detected=gibberish_reason is not None,
        generic_answer=is_generic_answer(answer, tokens, action_count),
        gibberish_reason=gibberish_reason,
        applied_score_cap=None,
    )


def score_dimensions(question: str, answer: str, signals: EvaluationSignals) -> DimensionScores:
    tokens = tokenize_words(answer)
    sentences = split_sentences(answer)
    unique_ratio = len(set(tokens)) / max(1, len(tokens))
    dominant_ratio = max((tokens.count(token) for token in set(tokens)), default=0) / max(1, len(tokens))
    avg_sentence_len = len(tokens) / max(1, len(sentences))
    action_count = sum(1 for token in tokens if token in ACTION_VERBS)
    hedge_count = sum(1 for token in tokens if token in HEDGE_WORDS)
    concrete_noun_hits = sum(
        1
        for token in tokens
        if token in {"team", "project", "deadline", "customer", "user", "mentor", "feature", "client", "stakeholder"}
    )

    relevance = 100 * (
        0.5 * signals.semantic_similarity +
        0.3 * signals.theme_match +
        0.2 * signals.keyword_overlap
    )
    if signals.semantic_similarity < 0.06 and signals.theme_match < 0.15:
        relevance = min(relevance, 24)
    if signals.theme_match >= 0.33 and signals.has_context and signals.has_action and signals.has_result:
        relevance = max(relevance, 66)
    if signals.theme_match >= 0.66 and signals.has_context and signals.has_action and signals.has_result:
        relevance = max(relevance, 80)

    clarity = 16
    clarity += min(signals.word_count, 80) / 80 * 18
    clarity += 14 if 2 <= signals.sentence_count <= 6 else 5
    clarity += clamp((unique_ratio - 0.35) * 42, 0, 18)
    clarity += 10 if 8 <= avg_sentence_len <= 26 else 4
    clarity += 8 if any(char in answer for char in ".!?") else 0
    clarity -= 25 if signals.gibberish_detected else 0
    clarity -= 14 if dominant_ratio > 0.4 else 0
    clarity -= 10 if signals.word_count < 18 else 0

    structure = 6
    structure += 24 if signals.has_context else 0
    structure += 34 if signals.has_action else 0
    structure += 26 if signals.has_result else 0
    structure += 8 if signals.sentence_count >= 3 else 0
    structure -= 10 if not signals.has_context and not signals.has_result else 0

    specificity = 8
    specificity += 24 if signals.has_metrics else 0
    specificity += min(action_count, 4) * 8
    specificity += min(concrete_noun_hits, 4) * 7
    specificity += 10 if signals.word_count >= 35 else 0
    specificity += 8 if signals.has_result else 0
    specificity -= 16 if signals.generic_answer else 0

    confidence_tone = 20
    confidence_tone += 26 if signals.has_first_person else 0
    confidence_tone += min(action_count, 3) * 10
    confidence_tone -= min(hedge_count, 3) * 10
    confidence_tone -= 12 if signals.gibberish_detected else 0
    confidence_tone -= 8 if not signals.has_action else 0

    grammar_basic = 70
    grammar_basic += 8 if signals.sentence_count >= 2 else 0
    grammar_basic -= 35 if signals.gibberish_detected else 0
    grammar_basic -= 12 if dominant_ratio > 0.45 else 0
    grammar_basic -= 10 if not any(char in answer for char in ".!?") and signals.word_count > 15 else 0

    return DimensionScores(
        relevance=round_score(relevance),
        clarity=round_score(clarity),
        structure=round_score(structure),
        specificity=round_score(specificity),
        confidence_tone=round_score(confidence_tone),
        grammar_basic=round_score(grammar_basic),
    )


def weighted_score(dimension_scores: DimensionScores) -> float:
    final_score = (
        0.30 * dimension_scores.relevance +
        0.20 * dimension_scores.clarity +
        0.15 * dimension_scores.structure +
        0.20 * dimension_scores.specificity +
        0.10 * dimension_scores.confidence_tone +
        0.05 * dimension_scores.grammar_basic
    )
    return round(final_score, 1)


def apply_guardrails(score: float, signals: EvaluationSignals) -> float:
    capped_score = score

    if signals.gibberish_detected:
        capped_score = min(capped_score, 12)
    elif signals.word_count < 8:
        capped_score = min(capped_score, 18)
    elif signals.word_count < 15:
        capped_score = min(capped_score, 28)
    elif signals.word_count < 25:
        capped_score = min(capped_score, 48)

    if signals.semantic_similarity < 0.05 and signals.theme_match < 0.15:
        capped_score = min(capped_score, 32)
    elif signals.semantic_similarity < 0.09 and signals.theme_match < 0.2:
        capped_score = min(capped_score, 45)

    if signals.generic_answer:
        capped_score = min(capped_score, 42)

    if not signals.has_context and not signals.has_action and not signals.has_result:
        capped_score = min(capped_score, 20)

    if not signals.has_result and not signals.has_metrics:
        capped_score = min(capped_score, 58)

    return round(capped_score, 1)


def band_from_score(score: float) -> EvaluationBand:
    if score >= 75:
        return "strong"
    if score >= 52:
        return "average"
    return "weak"


def build_strengths(dimension_scores: DimensionScores, signals: EvaluationSignals) -> list[str]:
    strengths: list[str] = []

    if dimension_scores.relevance >= 70:
        strengths.append("Your example stays relevant to the question being asked.")
    if dimension_scores.structure >= 68:
        strengths.append("Your answer follows a clear story with context, action, and outcome.")
    if dimension_scores.specificity >= 68:
        strengths.append("You include concrete details that make the example feel real and credible.")
    if dimension_scores.confidence_tone >= 68:
        strengths.append("Your wording shows ownership and confident decision-making.")
    if signals.has_metrics:
        strengths.append("You include measurable outcomes, which strengthens impact.")

    return strengths[:3] or ["You have the start of a behavioral answer, and it can become stronger with more concrete detail."]


def build_improvements(dimension_scores: DimensionScores, signals: EvaluationSignals) -> list[str]:
    improvements: list[str] = []

    if dimension_scores.relevance < 60:
        improvements.append("Make the story align more directly with the question theme.")
    if not signals.has_context:
        improvements.append("Add a clear situation or background so the interviewer understands the setting.")
    if not signals.has_action:
        improvements.append("Explain what you personally did instead of only describing the team or problem.")
    if not signals.has_result:
        improvements.append("Close with the outcome and what changed because of your actions.")
    if dimension_scores.specificity < 60:
        improvements.append("Add concrete details like scale, timeline, stakeholders, or measurable results.")
    if signals.gibberish_detected:
        improvements.append("Rewrite the answer in plain, meaningful language before evaluating it again.")
    if signals.generic_answer:
        improvements.append("Replace generic claims with one real example, a few actions, and a specific result.")

    deduped: list[str] = []
    for item in improvements:
        if item not in deduped:
            deduped.append(item)

    return deduped[:4]


def build_suggested_better_answer(question: str, signals: EvaluationSignals) -> str:
    theme = infer_question_theme(question)
    theme_hint = THEME_HINTS.get(theme, "a real example that directly matches this question")

    situation_hint = "Situation: briefly explain the context, team, and challenge you were dealing with."
    action_hint = "Action: describe the exact steps you personally took and why you chose them."
    result_hint = "Result: end with a concrete outcome, metric, or lesson learned."

    if signals.has_metrics:
        result_hint = "Result: include the concrete outcome and explain why it mattered."

    return (
        f"For this question, use a STAR answer about {theme_hint}. "
        f"{situation_hint} {action_hint} {result_hint}"
    )


@lru_cache(maxsize=512)
def evaluate_behavioral_answer(question: str, answer: str) -> EvaluationResponse:
    normalized_question = normalize_text(question)
    normalized_answer = normalize_text(answer)
    _, vectorizer = load_artifacts()

    signals = compute_signals(normalized_question, normalized_answer, vectorizer)
    dimension_scores = score_dimensions(normalized_question, normalized_answer, signals)
    raw_score = weighted_score(dimension_scores)
    final_score = apply_guardrails(raw_score, signals)

    if final_score != raw_score:
        signals = signals.model_copy(update={"applied_score_cap": final_score})

    return EvaluationResponse(
        question=question.strip(),
        answer=answer.strip(),
        final_score=final_score,
        band=band_from_score(final_score),
        dimension_scores=dimension_scores,
        signals=signals,
        strengths=build_strengths(dimension_scores, signals),
        improvements=build_improvements(dimension_scores, signals),
        suggested_better_answer=build_suggested_better_answer(question, signals),
    )
