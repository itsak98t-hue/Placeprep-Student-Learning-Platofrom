from __future__ import annotations

from typing import Any


def _format_question_context(question: dict[str, Any]) -> str:
    companies = ", ".join(str(company) for company in question.get("companies", [])[:5]) or "N/A"
    prerequisites = ", ".join(str(item) for item in question.get("prerequisites", [])) or "None"
    static_hints = "\n".join(
        f"- Hint {index + 1}: {hint}"
        for index, hint in enumerate(question.get("hint_levels", []))
        if isinstance(hint, str)
    ) or "- No static hints available."

    return (
        f"Question title: {question.get('title', '')}\n"
        f"Topic: {question.get('topic', '')}\n"
        f"Subtopic: {question.get('subtopic', '')}\n"
        f"Difficulty: {question.get('difficulty', '')}\n"
        f"Pattern: {question.get('pattern', '')}\n"
        f"Prerequisites: {prerequisites}\n"
        f"Relevant companies: {companies}\n"
        f"Static hints:\n{static_hints}"
    )


def build_hint_system_prompt() -> str:
    return (
        "You are a supportive coding interview coach. "
        "Give exactly one progressive hint. "
        "Do not reveal the full solution. "
        "Do not provide code. "
        "Keep the hint concise, practical, and student-friendly."
    )


def build_hint_user_prompt(
    *,
    question: dict[str, Any],
    user_id: str,
    status: str,
    hint_level: int,
    recent_attempts: list[dict[str, Any]],
) -> str:
    recent_context = "\n".join(
        f"- status={attempt.get('status')} time={attempt.get('time_spent_min')}min hints={attempt.get('hints_used')} confidence={attempt.get('confidence')}"
        for attempt in recent_attempts[:3]
    ) or "- No recent attempts for this question."

    return (
        "Generate one hint only.\n"
        f"User id: {user_id}\n"
        f"Current status: {status}\n"
        f"Requested hint level: {hint_level}\n"
        f"Recent attempts:\n{recent_context}\n\n"
        f"{_format_question_context(question)}\n\n"
        "Hint rules:\n"
        "- Move one small step forward from the current struggle.\n"
        "- Match the requested hint level.\n"
        "- Avoid code, pseudocode, or a full algorithm outline.\n"
        "- Prefer mental direction, invariant, or pattern recognition.\n"
        "- Return only the hint text."
    )


def build_explain_system_prompt() -> str:
    return (
        "You are a supportive coding coach helping a student reflect after an attempt. "
        "Be concise, practical, and encouraging. "
        "Do not provide code or a full editorial. "
        "Return valid JSON with keys explanation and focus_areas."
    )


def build_explain_user_prompt(
    *,
    question: dict[str, Any],
    user_id: str,
    status: str,
    time_spent_min: int,
    hints_used: int,
    confidence: int,
    recent_topic_attempts: list[dict[str, Any]],
) -> str:
    recent_context = "\n".join(
        f"- question={attempt.get('question_id')} status={attempt.get('status')} time={attempt.get('time_spent_min')} hints={attempt.get('hints_used')} confidence={attempt.get('confidence')}"
        for attempt in recent_topic_attempts[:5]
    ) or "- No recent topic attempts."

    return (
        "Return JSON only.\n"
        f"User id: {user_id}\n"
        f"Attempt status: {status}\n"
        f"Time spent: {time_spent_min} minutes\n"
        f"Hints used: {hints_used}\n"
        f"Confidence: {confidence} / 5\n"
        f"Recent attempts in this topic:\n{recent_context}\n\n"
        f"{_format_question_context(question)}\n\n"
        "Output format:\n"
        '{\n'
        '  "explanation": "short explanation",\n'
        '  "focus_areas": ["item 1", "item 2", "item 3"]\n'
        '}\n\n'
        "Explanation rules:\n"
        "- Explain why the user may have struggled.\n"
        "- Mention the core concept to focus on.\n"
        "- Focus areas must be short, actionable, and non-code.\n"
        "- Keep it student-friendly and concise."
    )


def build_reason_rewrite_system_prompt() -> str:
    return (
        "You rewrite recommendation reasons in a concise, encouraging tone. "
        "Keep it under 2 sentences and do not invent facts."
    )


def build_reason_rewrite_user_prompt(reason: str, question: dict[str, Any]) -> str:
    return (
        f"Original reason: {reason}\n"
        f"Question title: {question.get('title', '')}\n"
        f"Topic: {question.get('topic', '')}\n"
        "Rewrite this so it sounds a little more natural and student-friendly."
    )
