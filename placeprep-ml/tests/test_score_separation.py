from __future__ import annotations

from api.main import evaluate_submission, load_artifacts


QUESTION = "Tell me about a time you failed and what you learned from it."

TEST_CASES = [
    {
        "name": "gibberish",
        "answer": "asd qwe zxczxc qwe asd",
        "expected_labels": {"weak"},
        "max_scores": {"score_clarity": 1, "score_structure": 1, "score_impact": 1},
        "expected_invalid": True,
    },
    {
        "name": "tiny_weak",
        "answer": "I failed in a project and learned time management.",
        "expected_labels": {"weak"},
        "max_scores": {"score_clarity": 2, "score_structure": 2, "score_impact": 1},
        "expected_invalid": True,
    },
    {
        "name": "average",
        "answer": "I once missed a project deadline because I underestimated the work. I learned to plan better and communicate earlier.",
        "expected_labels": {"average"},
        "min_scores": {"score_clarity": 2, "score_structure": 2, "score_impact": 2},
        "expected_invalid": False,
    },
    {
        "name": "strong",
        "answer": "During a backend project, I underestimated integration complexity, delayed testing, faced deadline bugs, took responsibility, changed my process, and now test early and communicate blockers.",
        "expected_labels": {"strong", "average"},
        "min_scores": {"score_clarity": 2, "score_structure": 2, "score_impact": 2},
        "expected_invalid": False,
    },
]


def run() -> None:
    load_artifacts()

    for case in TEST_CASES:
        result = evaluate_submission(QUESTION, case["answer"])
        print(
            f"{case['name']}: label={result.label}, "
            f"clarity={result.score_clarity}, structure={result.score_structure}, impact={result.score_impact}, "
            f"missing={result.missing}"
        )

        assert result.label in case["expected_labels"], (
            f"{case['name']} expected label in {case['expected_labels']}, got {result.label}"
        )
        assert result.is_invalid_answer == case["expected_invalid"], (
            f"{case['name']} expected is_invalid_answer={case['expected_invalid']}, got {result.is_invalid_answer}"
        )

        for field_name, max_value in case.get("max_scores", {}).items():
            actual_value = getattr(result, field_name)
            assert actual_value <= max_value, (
                f"{case['name']} expected {field_name} <= {max_value}, got {actual_value}"
            )

        for field_name, min_value in case.get("min_scores", {}).items():
            actual_value = getattr(result, field_name)
            assert actual_value >= min_value, (
                f"{case['name']} expected {field_name} >= {min_value}, got {actual_value}"
            )

    print("Score separation checks passed.")


if __name__ == "__main__":
    run()
