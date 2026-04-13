from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from config.settings import MODEL_PATH, MODELS_DIR


EVAL_DATASET_PATH = ROOT_DIR / "tests" / "manual_eval_set.json"
VECTORIZER_PATH = MODELS_DIR / "vectorizer.joblib"
VALID_LABELS = ("weak", "average", "strong")


def load_json_dataset(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"Evaluation dataset not found: {path}")

    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except json.JSONDecodeError as error:
        raise ValueError(f"Invalid JSON in evaluation dataset: {path}") from error

    if not isinstance(data, list):
        raise ValueError(f"Expected a JSON array in: {path}")

    valid_records = [item for item in data if isinstance(item, dict)]
    if not valid_records:
        raise ValueError(f"No valid records found in evaluation dataset: {path}")

    return valid_records


def build_dataframe(records: list[dict[str, Any]]) -> pd.DataFrame:
    dataframe = pd.DataFrame(records)

    required_columns = {"question", "answer", "label"}
    missing_columns = required_columns.difference(dataframe.columns)
    if missing_columns:
        missing_text = ", ".join(sorted(missing_columns))
        raise ValueError(f"Evaluation dataset is missing required columns: {missing_text}")

    dataframe = dataframe[["question", "answer", "label"]].copy()
    dataframe["question"] = dataframe["question"].fillna("").astype(str).str.strip()
    dataframe["answer"] = dataframe["answer"].fillna("").astype(str).str.strip().str.lower()
    dataframe["label"] = dataframe["label"].fillna("").astype(str).str.strip().str.lower()

    dataframe = dataframe[
        (dataframe["question"] != "") & (dataframe["answer"] != "") & (dataframe["label"] != "")
    ]
    dataframe = dataframe[dataframe["label"].isin(VALID_LABELS)]

    if dataframe.empty:
        raise ValueError("No usable rows found after cleaning the evaluation dataset.")

    return dataframe.reset_index(drop=True)


def load_artifact(path: Path, artifact_name: str) -> Any:
    if not path.exists():
        raise FileNotFoundError(f"{artifact_name} file not found: {path}")

    try:
        return joblib.load(path)
    except Exception as error:
        raise ValueError(f"Failed to load {artifact_name.lower()} from: {path}") from error


def print_confusion_matrix_table(y_true: pd.Series, y_pred: Any) -> None:
    matrix = confusion_matrix(y_true, y_pred, labels=list(VALID_LABELS))
    matrix_df = pd.DataFrame(matrix, index=VALID_LABELS, columns=VALID_LABELS)

    print("Confusion matrix:")
    print(matrix_df.to_string())


def main() -> None:
    records = load_json_dataset(EVAL_DATASET_PATH)
    dataframe = build_dataframe(records)

    model = load_artifact(MODEL_PATH, "Model")
    vectorizer = load_artifact(VECTORIZER_PATH, "Vectorizer")

    texts = dataframe["answer"]
    labels = dataframe["label"]

    features = vectorizer.transform(texts)
    predictions = model.predict(features)

    accuracy = accuracy_score(labels, predictions)

    print(f"Dataset size: {len(dataframe)}")
    print(f"Accuracy: {accuracy:.4f}")
    print("Classification report:")
    print(classification_report(labels, predictions, labels=list(VALID_LABELS)))
    print_confusion_matrix_table(labels, predictions)


if __name__ == "__main__":
    main()
