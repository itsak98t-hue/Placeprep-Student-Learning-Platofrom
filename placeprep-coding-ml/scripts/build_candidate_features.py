from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from utils.data_loader import load_attempts, load_company_topic_weights, load_questions
from utils.feature_engineering import build_candidate_features, compute_topic_stats
from utils.filters import filter_candidate_questions


def main() -> None:
    """Print candidate feature rows for one user and target company."""
    user_id = sys.argv[1] if len(sys.argv) > 1 else "u1"
    target_company = sys.argv[2] if len(sys.argv) > 2 else "Amazon"

    questions = load_questions()
    attempts = load_attempts()
    company_topic_weights = load_company_topic_weights()
    topic_stats = compute_topic_stats(user_id, attempts, questions)
    candidate_pool = filter_candidate_questions(
        user_id=user_id,
        questions=questions,
        attempts=attempts,
        topic_stats=topic_stats,
        target_company=target_company,
    )

    payload = build_candidate_features(
        user_id=user_id,
        target_company=target_company,
        questions=candidate_pool or questions,
        attempts=attempts,
        topic_stats=topic_stats,
        company_topic_weights=company_topic_weights,
    )

    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
