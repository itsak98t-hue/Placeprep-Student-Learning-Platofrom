from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from utils.data_loader import load_attempts, load_company_topic_weights, load_questions


def main() -> None:
    """Validate the checked-in seed JSON files for local development."""
    questions = load_questions()
    attempts = load_attempts()
    company_topic_weights = load_company_topic_weights()

    summary = {
        "questions": len(questions),
        "attempts": len(attempts),
        "companies_with_topic_weights": sorted(company_topic_weights.keys()),
        "status": "ready",
    }

    if len(questions) < 30:
        raise ValueError("Seed data should contain at least 30 coding questions.")
    if len(attempts) < 20:
        raise ValueError("Seed data should contain at least 20 user attempts.")

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
