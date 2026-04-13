from __future__ import annotations

import json
import random
import re
import sys
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)
from sklearn.model_selection import GroupShuffleSplit


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from config.settings import CLEANED_DATA_DIR, MODEL_PATH, MODELS_DIR, ensure_directories


INPUT_FILENAME = "final_behavioral_dataset.json"
VECTORIZER_PATH = MODELS_DIR / "vectorizer.joblib"
CONFUSION_MATRIX_PATH = MODELS_DIR / "behavioral_confusion_matrix.txt"
TEST_SIZE = 0.2
RANDOM_STATE = 42
MAX_FEATURES = 3000
LABEL_ORDER = ["weak", "average", "strong"]
LABEL_NOISE_RATE = 0.05
AUGMENTATION_RANDOM_SEED = 42

WEAK_GENERIC_TEMPLATES = [
    "I took ownership and made sure everything moved forward, but I cannot point to a specific result.",
    "I stayed confident, communicated clearly, and kept the team aligned, even though the details were still evolving.",
    "I handled the situation directly and made decisions quickly, but I did not really measure the final outcome.",
]

VAGUE_RESULT_REPLACEMENTS = [
    "things improved overall",
    "the outcome was positive for the team",
    "it helped the project move forward",
    "everyone felt better about the direction",
]


def load_dataset(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"Training dataset not found: {path}")

    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except json.JSONDecodeError as error:
        raise ValueError(f"Invalid JSON in dataset file: {path}") from error

    if not isinstance(data, list):
        raise ValueError(f"Expected a JSON array in: {path}")

    records = [item for item in data if isinstance(item, dict)]
    if not records:
        raise ValueError(f"No valid records found in dataset: {path}")

    return records


def preprocess_text(value: Any) -> str:
    return " ".join(str(value).strip().lower().split())


def _slugify_text(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return cleaned or "unknown"


def derive_group_ids(records: list[dict[str, Any]]) -> list[str]:
    derived_groups: list[str] = []

    for record in records:
        explicit_group = record.get("source_group") or record.get("seed_group")
        if explicit_group is not None and str(explicit_group).strip():
            derived_groups.append(preprocess_text(explicit_group))
            continue

        raw_id = preprocess_text(record.get("id", ""))
        if "::" in raw_id:
            derived_groups.append(raw_id)
            continue

        category = preprocess_text(record.get("category", "unknown"))
        question = preprocess_text(record.get("question", ""))
        if raw_id.isdigit():
            try:
                family_number = (max(int(raw_id) - 1, 0) // 3) + 1
                derived_groups.append(f"{_slugify_text(category)}::family_{family_number}")
                continue
            except ValueError:
                pass

        derived_groups.append(f"{_slugify_text(category)}::{_slugify_text(question)}")

    return derived_groups


def build_dataframe(records: list[dict[str, Any]]) -> pd.DataFrame:
    normalized_records: list[dict[str, Any]] = []
    group_ids = derive_group_ids(records)

    for record, group_id in zip(records, group_ids, strict=False):
        question = preprocess_text(record.get("question", ""))
        answer = preprocess_text(record.get("answer", ""))
        label = preprocess_text(record.get("label", ""))

        if not question or not answer or label not in LABEL_ORDER:
            continue

        normalized_records.append(
            {
                "question": question,
                "answer": answer,
                "label": label,
                "source_group": group_id,
            }
        )

    dataframe = pd.DataFrame(normalized_records)
    if dataframe.empty:
        raise ValueError("Dataset has no usable rows after cleaning empty question, answer, or label values.")

    return dataframe.drop_duplicates(subset=["source_group", "label", "answer"]).reset_index(drop=True)


def validate_dataset(dataframe: pd.DataFrame) -> None:
    if len(dataframe) < 12:
        raise ValueError("Dataset is too small to train reliably. Add more grouped samples before training.")

    if dataframe["label"].nunique() < 2:
        raise ValueError("Training requires at least two label classes.")

    if dataframe["source_group"].nunique() < 2:
        raise ValueError("Grouped splitting requires at least two unique source groups.")


def remove_metrics_but_keep_strength(answer: str) -> str:
    updated = re.sub(r"\b\d+[%xX]?\b", "", answer)
    updated = re.sub(r"\b(within|in|over)\s+\w+\s+(days|weeks|months|quarters)\b", "", updated)
    updated = re.sub(r"\b(reduced|improved|increased)\s+by\b", r"\1", updated)
    return preprocess_text(updated)


def weaken_impact_but_keep_structure(answer: str, rng: random.Random) -> str:
    sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+", answer) if part.strip()]
    if not sentences:
        return preprocess_text(answer)

    if len(sentences) >= 3:
        sentences[-1] = rng.choice(VAGUE_RESULT_REPLACEMENTS).capitalize() + "."
    updated = " ".join(sentences)
    updated = re.sub(r"\b\d+[%xX]?\b", "", updated)
    return preprocess_text(updated)


def make_confident_but_weak(answer: str, rng: random.Random) -> str:
    opening = rng.choice(
        [
            "I handled it confidently and kept things moving.",
            "I stepped in quickly and made sure the team stayed aligned.",
            "I took charge of the situation and communicated clearly.",
        ]
    )
    return preprocess_text(f"{opening} {rng.choice(WEAK_GENERIC_TEMPLATES)}")


def make_student_style_messy(answer: str) -> str:
    updated = answer
    replacements = [
        (r"\bI\b", "i"),
        (r"\bwas\b", "was kinda"),
        (r"\bwere\b", "was"),
        (r"\bdidn't\b", "didnt"),
        (r"\bbecause\b", "becuz"),
    ]
    for pattern, replacement in replacements[:3]:
        updated = re.sub(pattern, replacement, updated, count=1)
    updated = updated.replace(". ", " ")
    updated = updated.replace(", ", " ")
    return preprocess_text(updated)


def augment_dataframe(dataframe: pd.DataFrame) -> pd.DataFrame:
    rng = random.Random(AUGMENTATION_RANDOM_SEED)
    augmented_rows: list[dict[str, str]] = []

    for row in dataframe.to_dict("records"):
        label = row["label"]
        answer = row["answer"]
        source_group = row["source_group"]

        if label == "strong":
            strong_without_metrics = remove_metrics_but_keep_strength(answer)
            if strong_without_metrics and strong_without_metrics != answer:
                augmented_rows.append(
                    {
                        "question": row["question"],
                        "answer": strong_without_metrics,
                        "label": "strong",
                        "source_group": source_group,
                    }
                )

        if label in {"average", "strong"}:
            weak_impact = weaken_impact_but_keep_structure(answer, rng)
            if weak_impact:
                augmented_rows.append(
                    {
                        "question": row["question"],
                        "answer": weak_impact,
                        "label": "average",
                        "source_group": source_group,
                    }
                )

        if label in {"weak", "average"}:
            confident_weak = make_confident_but_weak(answer, rng)
            augmented_rows.append(
                {
                    "question": row["question"],
                    "answer": confident_weak,
                    "label": "weak",
                    "source_group": source_group,
                }
            )

        messy_answer = make_student_style_messy(answer)
        if messy_answer and messy_answer != answer:
            messy_label = "weak" if label == "weak" else "average"
            augmented_rows.append(
                {
                    "question": row["question"],
                    "answer": messy_answer,
                    "label": messy_label,
                    "source_group": source_group,
                }
            )

    if not augmented_rows:
        return dataframe

    augmented_df = pd.concat([dataframe, pd.DataFrame(augmented_rows)], ignore_index=True)
    augmented_df = augmented_df.drop_duplicates(subset=["source_group", "label", "answer"]).reset_index(drop=True)
    return augmented_df


def build_vectorizer() -> TfidfVectorizer:
    return TfidfVectorizer(
        max_features=MAX_FEATURES,
        ngram_range=(1, 1),
        lowercase=True,
        min_df=2,
        sublinear_tf=True,
    )


def split_data(dataframe: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    groups = dataframe["source_group"]
    splitter = GroupShuffleSplit(n_splits=1, test_size=TEST_SIZE, random_state=RANDOM_STATE)

    train_df: pd.DataFrame | None = None
    test_df: pd.DataFrame | None = None

    for train_index, test_index in splitter.split(dataframe, dataframe["label"], groups):
        train_df = dataframe.iloc[train_index].reset_index(drop=True)
        test_df = dataframe.iloc[test_index].reset_index(drop=True)

    if train_df is None or test_df is None or train_df.empty or test_df.empty:
        raise ValueError("Grouped split failed to produce non-empty train and test sets.")

    overlapping_groups = set(train_df["source_group"]).intersection(set(test_df["source_group"]))
    if overlapping_groups:
        raise ValueError("Grouped split leakage detected: some source groups appeared in both train and test.")

    return train_df, test_df


def apply_label_noise(train_df: pd.DataFrame, noise_rate: float = LABEL_NOISE_RATE) -> pd.DataFrame:
    if noise_rate <= 0:
        return train_df

    rng = random.Random(RANDOM_STATE)
    noisy_df = train_df.copy()
    sample_size = max(1, int(len(noisy_df) * noise_rate))
    sample_indices = rng.sample(range(len(noisy_df)), k=min(sample_size, len(noisy_df)))

    for index in sample_indices:
        current_label = str(noisy_df.at[index, "label"])
        alternatives = [label for label in LABEL_ORDER if label != current_label]
        noisy_df.at[index, "label"] = rng.choice(alternatives)

    return noisy_df


def train_model(train_df: pd.DataFrame) -> tuple[LogisticRegression, TfidfVectorizer]:
    vectorizer = build_vectorizer()
    noisy_train_df = apply_label_noise(train_df)
    x_train = vectorizer.fit_transform(noisy_train_df["answer"])
    y_train = noisy_train_df["label"]

    model = LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        C=0.3,
        solver="lbfgs",
        random_state=RANDOM_STATE,
    )
    model.fit(x_train, y_train)
    return model, vectorizer


def save_confusion_matrix(matrix_df: pd.DataFrame) -> Path:
    CONFUSION_MATRIX_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONFUSION_MATRIX_PATH.write_text(matrix_df.to_string(), encoding="utf-8")
    return CONFUSION_MATRIX_PATH


def evaluate_model(
    model: LogisticRegression,
    vectorizer: TfidfVectorizer,
    test_df: pd.DataFrame,
) -> Path:
    x_test = vectorizer.transform(test_df["answer"])
    y_true = test_df["label"]
    predictions = model.predict(x_test)

    accuracy = accuracy_score(y_true, predictions)
    macro_precision, macro_recall, macro_f1, _ = precision_recall_fscore_support(
        y_true,
        predictions,
        average="macro",
        zero_division=0,
    )
    weighted_precision, weighted_recall, weighted_f1, _ = precision_recall_fscore_support(
        y_true,
        predictions,
        average="weighted",
        zero_division=0,
    )
    matrix = confusion_matrix(y_true, predictions, labels=LABEL_ORDER)
    matrix_df = pd.DataFrame(matrix, index=LABEL_ORDER, columns=LABEL_ORDER)
    report = classification_report(y_true, predictions, labels=LABEL_ORDER, zero_division=0)
    matrix_path = save_confusion_matrix(matrix_df)

    print("Evaluation metrics:")
    print(f"  Accuracy:           {accuracy:.4f}")
    print(f"  Macro precision:    {macro_precision:.4f}")
    print(f"  Macro recall:       {macro_recall:.4f}")
    print(f"  Macro F1:           {macro_f1:.4f}")
    print(f"  Weighted precision: {weighted_precision:.4f}")
    print(f"  Weighted recall:    {weighted_recall:.4f}")
    print(f"  Weighted F1:        {weighted_f1:.4f}")
    print("Confusion matrix:")
    print(matrix_df)
    print("Classification report:")
    print(report)
    print(f"Confusion matrix saved to: {matrix_path}")

    return matrix_path


def save_model(model: LogisticRegression, vectorizer: TfidfVectorizer) -> None:
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    VECTORIZER_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)


def print_dataset_summary(dataframe: pd.DataFrame, train_df: pd.DataFrame, test_df: pd.DataFrame) -> None:
    print(f"Dataset size: {len(dataframe)}")
    print(f"Unique source groups: {dataframe['source_group'].nunique()}")
    print(f"Train size: {len(train_df)}")
    print(f"Test size: {len(test_df)}")
    print(f"Train source groups: {train_df['source_group'].nunique()}")
    print(f"Test source groups: {test_df['source_group'].nunique()}")
    print("Train label distribution:")
    print(train_df["label"].value_counts().sort_index())
    print("Test label distribution:")
    print(test_df["label"].value_counts().sort_index())


def main() -> None:
    ensure_directories()

    dataset_path = CLEANED_DATA_DIR / INPUT_FILENAME
    records = load_dataset(dataset_path)
    dataframe = build_dataframe(records)
    dataframe = augment_dataframe(dataframe)
    validate_dataset(dataframe)

    train_df, test_df = split_data(dataframe)
    print_dataset_summary(dataframe, train_df, test_df)

    model, vectorizer = train_model(train_df)
    evaluate_model(model, vectorizer, test_df)
    save_model(model, vectorizer)

    print(f"Model saved to: {MODEL_PATH}")
    print(f"Vectorizer saved to: {VECTORIZER_PATH}")


if __name__ == "__main__":
    main()
