const DEFAULT_TIMEOUT_MS = 30000

export async function fetchGroqWithTimeout(body: unknown, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY.")
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Groq request failed with status ${response.status}: ${detail}`)
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Groq request timed out.")
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
