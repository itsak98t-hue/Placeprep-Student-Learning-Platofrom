from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from .coding import NON_CODING_TOPIC_ERROR, SUPPORTED_CODING_TOPICS


DifficultyName = Literal["easy", "medium", "hard"]
VariantType = Literal["easier", "same_pattern", "harder_twist", "follow_up"]

DIFFICULTY_NAME_TO_LEVEL: dict[str, int] = {
    "easy": 1,
    "medium": 2,
    "hard": 3,
}

GENERIC_TITLES = {
    "array problem",
    "string problem",
    "graph problem",
    "tree problem",
    "dynamic programming problem",
    "coding problem",
    "practice problem",
    "problem",
}

MIN_STATEMENT_LENGTH = 60
MIN_EXPLANATION_LENGTH = 20


def validate_coding_topic(topic: str) -> str:
    normalized = topic.strip().lower()
    if normalized not in SUPPORTED_CODING_TOPICS:
        raise ValueError(NON_CODING_TOPIC_ERROR)
    return normalized


def clean_string(value: str) -> str:
    return value.strip()


class CodingExample(BaseModel):
    input: str = Field(..., min_length=1)
    output: str = Field(..., min_length=1)
    explanation: str = ""

    @field_validator("input", "output", mode="before")
    @classmethod
    def validate_required_strings(cls, value: str) -> str:
        if value is None:
            raise ValueError("Example input and output must not be null.")
        cleaned = str(value).strip()
        if not cleaned:
            raise ValueError("Example input and output must not be empty.")
        return cleaned

    @field_validator("explanation", mode="before")
    @classmethod
    def normalize_explanation(cls, value: str | None) -> str:
        if value is None:
            return ""
        return str(value).strip()


class CodingStarterCode(BaseModel):
    python: str = Field(..., min_length=1)

    @field_validator("python", mode="before")
    @classmethod
    def validate_python(cls, value: str) -> str:
        if value is None:
            raise ValueError("starter_code.python must not be null.")
        cleaned = str(value).strip()
        if not cleaned:
            raise ValueError("starter_code.python must not be empty.")
        return cleaned


class SeedCodingQuestion(BaseModel):
    id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1)
    topic: str = Field(..., min_length=1)
    difficulty: DifficultyName
    difficulty_level: int = Field(..., ge=1, le=3)
    statement: str = Field(..., min_length=1)
    examples: list[CodingExample] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    starter_code: CodingStarterCode
    tags: list[str] = Field(default_factory=list)

    @field_validator("id", "title", "statement", mode="before")
    @classmethod
    def validate_strings(cls, value: str) -> str:
        if value is None:
            raise ValueError("Required seed fields must not be null.")
        cleaned = clean_string(str(value))
        if not cleaned:
            raise ValueError("Required seed fields must not be empty.")
        return cleaned

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, value: str) -> str:
        return validate_coding_topic(value)

    @field_validator("constraints", "tags")
    @classmethod
    def validate_string_lists(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item and item.strip()]

    @model_validator(mode="after")
    def validate_difficulty_pair(self) -> "SeedCodingQuestion":
        expected_level = DIFFICULTY_NAME_TO_LEVEL[self.difficulty]
        if self.difficulty_level != expected_level:
            raise ValueError("difficulty and difficulty_level must match.")
        return self


class GeneratedCodingVariant(BaseModel):
    title: str = Field(..., min_length=1)
    topic: str = Field(..., min_length=1)
    difficulty: DifficultyName
    difficulty_level: int = Field(..., ge=1, le=3)
    variant_type: VariantType
    statement: str = Field(..., min_length=1)
    examples: list[CodingExample] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    starter_code: CodingStarterCode
    hints: list[str] = Field(default_factory=list)
    explanation: str = Field(..., min_length=1)
    tags: list[str] = Field(default_factory=list)

    @field_validator("title", "statement", "explanation", mode="before")
    @classmethod
    def validate_core_strings(cls, value: str) -> str:
        if value is None:
            raise ValueError("Generated variant fields must not be null.")
        cleaned = clean_string(str(value))
        if not cleaned:
            raise ValueError("Generated variant fields must not be empty.")
        return cleaned

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, value: str) -> str:
        return validate_coding_topic(value)

    @field_validator("constraints", "hints", "tags")
    @classmethod
    def validate_lists(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item and item.strip()]

    @model_validator(mode="after")
    def validate_variant_fields(self) -> "GeneratedCodingVariant":
        expected_level = DIFFICULTY_NAME_TO_LEVEL[self.difficulty]
        if self.difficulty_level != expected_level:
            raise ValueError("difficulty and difficulty_level must match.")
        if self.title.lower() in GENERIC_TITLES:
            raise ValueError("Generated variant title is too generic.")
        if len(self.title) < 6:
            raise ValueError("Generated variant title is too short.")
        if len(self.statement) < MIN_STATEMENT_LENGTH:
            raise ValueError("Generated variant statement is too short or vague.")
        if len(self.explanation) < MIN_EXPLANATION_LENGTH:
            raise ValueError("Generated variant explanation is too short.")
        if not self.starter_code.python.strip():
            raise ValueError("Generated variant starter_code.python must not be empty.")
        if len(self.hints) < 2:
            raise ValueError("Generated variant must include at least 2 hints.")
        if not self.tags:
            raise ValueError("Generated variant tags must not be empty.")
        return self


class CodingVariantsPayload(BaseModel):
    seed_question_id: str = Field(..., min_length=1)
    variants: list[GeneratedCodingVariant] = Field(..., min_length=1)
    saved_count: int = 0
    skipped_duplicates_count: int = 0
    file_paths_used: list[str] = Field(default_factory=list)
    warning: str | None = None


class CodingGenerateVariantsRequest(BaseModel):
    seed_question: SeedCodingQuestion
    count: int = Field(default=3, ge=1, le=6)
    save_to_bank: bool = False
    save_generated: bool = False


class CodingGenerateVariantsResponse(BaseModel):
    success: bool
    seed_question_id: str
    generated_count: int
    variants: list[GeneratedCodingVariant]
    saved_count: int = 0
    skipped_duplicates_count: int = 0
    file_paths_used: list[str] = Field(default_factory=list)
    warning: str | None = None
