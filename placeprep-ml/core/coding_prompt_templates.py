from __future__ import annotations

import json

from schemas.coding_generation import SeedCodingQuestion


SYSTEM_PROMPT = """You generate coding interview practice variants.

Return STRICT JSON only.
Do not include markdown.
Do not include commentary.
Do not wrap the JSON in code fences.
Only generate coding questions.
Keep outputs valid, realistic, and interview-quality.
Every variant must be meaningful interview practice, not a toy exercise.
"""


def _variant_mix_rule(count: int) -> str:
    if count == 3:
        return (
            "Return exactly 3 variants in this exact order: "
            "one easier, one same_pattern, and one harder_twist."
        )

    return (
        f"Return exactly {count} variants. Prefer easier, same_pattern, and "
        "harder_twist before any follow_up variant."
    )


def build_variant_generation_prompt(
    seed_question: SeedCodingQuestion,
    count: int,
    *,
    strict_retry: bool = False,
    failure_reasons: list[str] | None = None,
) -> str:
    seed_payload = json.dumps(seed_question.model_dump(mode="json"), indent=2)
    retry_block = ""

    if strict_retry:
        joined_reasons = "\n".join(f"- {reason}" for reason in (failure_reasons or []))
        retry_block = f"""
This is a retry because the previous response failed quality checks.
You must correct these issues:
{joined_reasons or "- The response did not meet strict variant quality checks."}

Be stricter than before:
- Do not return vague variants
- Do not return null example explanations
- Do not paraphrase the seed with only superficial wording changes
- Do not simplify the easier variant into a toy problem
- Do not change the core interview pattern
"""

    return f"""Generate coding interview practice variants from the seed question below.

Primary goals:
- Stay within coding topics only
- Keep the exact same topic as the seed question
- Keep the same conceptual family and interview pattern as the seed question
- Make each question interview-quality, realistic, and solvable
- Keep the easier variant meaningfully easier without becoming trivial
- Keep the same_pattern variant close in skill usage, not just wording
- Make the harder_twist variant add one meaningful challenge without changing topic completely
- Avoid duplicates and avoid shallow paraphrases
- Include useful hints and a concise explanation
- Keep starter_code.python non-empty
- Return only valid JSON

Variant quality rules:
- easier: simplify one aspect of the seed problem while preserving the same core pattern
- same_pattern: keep similar algorithmic reasoning and interview skill usage with a fresh scenario
- harder_twist: add one meaningful challenge such as an extra constraint, optimization target, or edge-case dimension
- Unless the seed is already extremely easy, do not produce toy versions that remove the core learning pattern
- Every statement must be specific enough for an interview candidate to implement against
- Every title must sound like a real coding interview question

Variant mix:
- {_variant_mix_rule(count)}

Difficulty rules:
- easier should usually be one level lower when possible
- same_pattern should usually match the seed difficulty
- harder_twist should usually be one level higher when possible
- difficulty must match difficulty_level exactly:
  easy=1, medium=2, hard=3

Strict output rules:
- Return one JSON object only
- No text before or after the JSON
- Return exactly {count} variants
- Ensure every topic is coding-only and matches the seed topic
- Ensure title, statement, explanation, and starter_code.python are non-empty
- Ensure hints is a JSON array with at least 2 non-empty strings
- Ensure tags is a non-empty JSON array of strings
- Ensure example.explanation is a string, never null
- Ensure each statement is substantive, not vague, and long enough to be meaningful
- For count=3, you must return exactly one easier, one same_pattern, and one harder_twist
- Do not return duplicates

Match this exact top-level shape:
{{
  "seed_question_id": "...",
  "variants": [
    {{
      "title": "...",
      "topic": "...",
      "difficulty": "easy|medium|hard",
      "difficulty_level": 1|2|3,
      "variant_type": "easier|same_pattern|harder_twist|follow_up",
      "statement": "...",
      "examples": [
        {{
          "input": "...",
          "output": "...",
          "explanation": "..."
        }}
      ],
      "constraints": ["..."],
      "starter_code": {{
        "python": "..."
      }},
      "hints": ["...", "..."],
      "explanation": "...",
      "tags": ["..."]
    }}
  ]
}}
{retry_block}
Seed question JSON:
{seed_payload}
"""
