from __future__ import annotations

import json
import os
from typing import Any


DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"

try:
    from groq import Groq
except ImportError:  # pragma: no cover - handled gracefully at runtime
    Groq = None  # type: ignore[assignment]


def get_groq_model() -> str:
    return os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL).strip() or DEFAULT_GROQ_MODEL


class GroqClientWrapper:
    """Thin Groq wrapper so the rest of the backend can fail gracefully."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.model = get_groq_model()
        self._client = Groq(api_key=self.api_key) if self.api_key and Groq is not None else None

    @property
    def is_available(self) -> bool:
        return self._client is not None

    def create_text_completion(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 220,
    ) -> str | None:
        if not self._client:
            return None

        try:
            response = self._client.chat.completions.create(
                model=self.model,
                temperature=temperature,
                max_tokens=max_tokens,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
        except Exception:
            return None

        if not response.choices:
            return None

        content = response.choices[0].message.content
        if isinstance(content, str):
            stripped = content.strip()
            return stripped or None

        return None

    def create_json_completion(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 320,
    ) -> dict[str, Any] | None:
        raw_output = self.create_text_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if not raw_output:
            return None

        try:
            return json.loads(raw_output)
        except json.JSONDecodeError:
            start_index = raw_output.find("{")
            end_index = raw_output.rfind("}")
            if start_index == -1 or end_index == -1 or end_index <= start_index:
                return None

            try:
                return json.loads(raw_output[start_index : end_index + 1])
            except json.JSONDecodeError:
                return None


groq_client = GroqClientWrapper()
