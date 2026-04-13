from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from utils.data_loader import load_attempts, load_questions
from utils.feature_engineering import build_user_summary, compute_topic_stats


def main() -> None:
    """Print per-user topic stats and summary fields for quick inspection."""
    attempts = load_attempts()
    questions = load_questions()
    user_ids = sorted({str(attempt.get("user_id")) for attempt in attempts if attempt.get("user_id")})

    payload = {}
    for user_id in user_ids:
        topic_stats = compute_topic_stats(user_id, attempts, questions)
        payload[user_id] = {
            "summary": build_user_summary(
                user_id=user_id,
                attempts=attempts,
                topic_stats=topic_stats,
            ),
            "topic_stats": topic_stats,
        }

    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
