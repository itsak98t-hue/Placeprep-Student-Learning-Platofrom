from __future__ import annotations

from pathlib import Path

from coding.models.schemas import CodingQuestion, QuestionVariant
from coding.utils.helpers import load_json_data


def _load_questions(questions_path: Path) -> list[CodingQuestion]:
    raw_questions = load_json_data(questions_path, default=[])
    return [CodingQuestion.model_validate(item) for item in raw_questions]


def _wording_variant(question: CodingQuestion) -> QuestionVariant:
    return QuestionVariant(
        variant_id=f"{question.id}-variant-wording",
        source_question_id=question.id,
        title=f"{question.title} Practice Variant",
        topic=question.topic,
        difficulty=question.difficulty,
        problem_statement=(
            f"Practice variant: {question.problem_statement} "
            "Explain your approach clearly and pay attention to the same core pattern."
        ),
        hints=question.hints[:],
        patterns=question.patterns[:],
    )


def _constraint_variant(question: CodingQuestion) -> QuestionVariant:
    return QuestionVariant(
        variant_id=f"{question.id}-variant-constraints",
        source_question_id=question.id,
        title=f"{question.title} Constraint Twist",
        topic=question.topic,
        difficulty=question.difficulty,
        problem_statement=(
            f"{question.problem_statement} As an extra requirement, discuss how your solution behaves "
            "when the input size is large and mention the expected time complexity."
        ),
        hints=question.hints[:] + ["Think about whether the same algorithm still meets efficiency expectations."],
        patterns=question.patterns[:],
    )


def _numbers_variant(question: CodingQuestion) -> QuestionVariant:
    return QuestionVariant(
        variant_id=f"{question.id}-variant-scenario",
        source_question_id=question.id,
        title=f"{question.title} Scenario Variant",
        topic=question.topic,
        difficulty=question.difficulty,
        problem_statement=(
            f"{question.problem_statement} Use a fresh set of sample values and test edge cases such as "
            "small input sizes, repeated values, or already-optimized arrangements."
        ),
        hints=question.hints[:],
        patterns=question.patterns[:],
    )


def generate_question_variants(question_id: str, questions_path: Path) -> tuple[CodingQuestion, list[QuestionVariant]]:
    questions = _load_questions(questions_path)
    source_question = next((question for question in questions if question.id == question_id), None)

    if source_question is None:
        raise ValueError(f"Question '{question_id}' was not found.")

    variants = [
        _wording_variant(source_question),
        _constraint_variant(source_question),
        _numbers_variant(source_question),
    ]
    return source_question, variants
