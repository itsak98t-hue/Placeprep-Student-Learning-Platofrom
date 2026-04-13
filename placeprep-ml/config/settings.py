from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"

# Always load the backend-local .env file explicitly so the API process and
# local test scripts resolve the same configuration source.
load_dotenv(ENV_PATH)

SEED_DATA_PATH = BASE_DIR / "seed_data" / "behavioral_seed.json"
GENERATED_DATA_DIR = BASE_DIR / "generated_data"
CLEANED_DATA_DIR = BASE_DIR / "cleaned_data"
MODELS_DIR = BASE_DIR / "models"

MERGED_DATASET_PATH = CLEANED_DATA_DIR / "merged_behavioral_dataset.json"
FINAL_DATASET_JSON_PATH = CLEANED_DATA_DIR / "final_behavioral_dataset.json"
FINAL_DATASET_CSV_PATH = CLEANED_DATA_DIR / "final_behavioral_dataset.csv"

# Backward-compatible aliases for scripts that expect generic output names.
DEFAULT_OUTPUT_JSON = FINAL_DATASET_JSON_PATH
DEFAULT_OUTPUT_CSV = FINAL_DATASET_CSV_PATH

SYNTHETIC_GENERATION_COUNT = 1200
RANDOM_SEED = 42
TRAIN_TEST_SPLIT = 0.2

MODEL_PATH = MODELS_DIR / "behavioral_model.joblib"

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DEFAULT_GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")


def ensure_directories() -> None:
    for path in (
        GENERATED_DATA_DIR,
        CLEANED_DATA_DIR,
        MODELS_DIR,
    ):
        path.mkdir(parents=True, exist_ok=True)
