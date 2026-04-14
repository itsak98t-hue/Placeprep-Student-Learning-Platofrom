import type {
  CodingAttemptRequest,
  CodingAttemptResponse,
  CodingDifficulty,
  CodingExplainRequest,
  CodingExplainResponse,
  CodingHintRequest,
  CodingHintResponse,
  CodingRecommendationRequest,
  CodingRecommendationResponse,
  CodingUserSummary,
  CodingQuestion,
  UserStatsResponse,
} from "@/types/coding"
import { isProd, logClientDebug } from "@/lib/runtime-config"
import { getCodingCatalogQuestionsByCompany } from "@/lib/coding-question-bridge"

const REQUEST_TIMEOUT_MS = 30000

type ApiErrorPayload = {
  success?: boolean
  error?: {
    code?: number
    message?: string
    details?: unknown
  }
  detail?: string
}

function getBaseUrl(): string {
  return "/api"
}

function isCodingQuestion(value: unknown): value is CodingQuestion {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.question_id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.platform === "string" &&
    typeof candidate.topic === "string" &&
    typeof candidate.difficulty === "number" &&
    typeof candidate.external_link === "string" &&
    typeof candidate.subtopic === "string" &&
    typeof candidate.pattern === "string" &&
    (candidate.hint_levels === undefined || Array.isArray(candidate.hint_levels)) &&
    (candidate.fallback_question_ids === undefined || Array.isArray(candidate.fallback_question_ids)) &&
    (candidate.upgrade_question_ids === undefined || Array.isArray(candidate.upgrade_question_ids)) &&
    (candidate.similar_question_ids === undefined || Array.isArray(candidate.similar_question_ids))
  )
}

function isRecommendationResponse(value: unknown): value is CodingRecommendationResponse {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.user_id === "string" &&
    typeof candidate.focus_topic === "string" &&
    (candidate.target_company === undefined ||
      candidate.target_company === null ||
      typeof candidate.target_company === "string") &&
    isCodingQuestion(candidate.primary_question) &&
    Array.isArray(candidate.easier_questions) &&
    candidate.easier_questions.every(isCodingQuestion) &&
    Array.isArray(candidate.harder_questions) &&
    candidate.harder_questions.every(isCodingQuestion) &&
    Array.isArray(candidate.similar_questions) &&
    candidate.similar_questions.every(isCodingQuestion) &&
    typeof candidate.reason === "string"
  )
}

function isAttemptResponse(value: unknown): value is CodingAttemptResponse {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>
  const attempt = candidate.attempt as Record<string, unknown> | undefined

  return (
    typeof candidate.success === "boolean" &&
    typeof candidate.message === "string" &&
    !!attempt &&
    typeof attempt.user_id === "string" &&
    typeof attempt.question_id === "string" &&
    typeof attempt.topic === "string" &&
    typeof attempt.difficulty === "number" &&
    typeof attempt.status === "string" &&
    typeof attempt.time_spent_min === "number" &&
    typeof attempt.hints_used === "number" &&
    typeof attempt.confidence === "number" &&
    typeof attempt.attempted_at === "string"
  )
}

function isHintResponse(value: unknown): value is CodingHintResponse {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.hint === "string" &&
    typeof candidate.hint_level === "number" &&
    (candidate.source === "groq" || candidate.source === "static")
  )
}

function isExplainResponse(value: unknown): value is CodingExplainResponse {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.explanation === "string" &&
    Array.isArray(candidate.focus_areas) &&
    candidate.focus_areas.every((item) => typeof item === "string") &&
    (candidate.source === "groq" || candidate.source === "fallback")
  )
}

function isUserStatsResponse(value: unknown): value is UserStatsResponse {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.user_id === "string" &&
    typeof candidate.topic_stats === "object" &&
    candidate.topic_stats !== null &&
    isCodingUserSummary(candidate.summary)
  )
}

function isCodingUserSummary(value: unknown): value is CodingUserSummary {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.total_attempts === "number" &&
    typeof candidate.total_solved === "number" &&
    typeof candidate.total_partial === "number" &&
    typeof candidate.total_failed === "number" &&
    typeof candidate.total_skipped === "number" &&
    typeof candidate.tracked_topics === "number" &&
    typeof candidate.overall_success_rate === "number" &&
    typeof candidate.avg_time_spent === "number" &&
    typeof candidate.avg_hints_used === "number" &&
    (candidate.weakest_topic === null || typeof candidate.weakest_topic === "string") &&
    (candidate.strongest_topic === null || typeof candidate.strongest_topic === "string") &&
    Array.isArray(candidate.focus_topics) &&
    Array.isArray(candidate.recent_struggle_topics)
  )
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const errorPayload = (await response.json()) as ApiErrorPayload

    if (errorPayload.error?.message) {
      return errorPayload.error.message
    }

    if (errorPayload.detail) {
      return errorPayload.detail
    }
  } catch {
    // Ignore JSON parsing issues and fall back to generic messages below.
  }

  if (response.status >= 500) {
    return "The coding recommendation service is having trouble right now. Please try again shortly."
  }

  return "The coding recommendation request could not be completed."
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const endpoint = `${getBaseUrl()}${path}`

  try {
    logClientDebug("Coding API request", {
      endpoint,
      method: init?.method ?? "GET",
      isProd,
    })

    const response = await fetch(endpoint, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(await parseErrorResponse(response))
    }

    logClientDebug("Coding API response", {
      endpoint,
      ok: true,
      status: response.status,
    })
    return (await response.json()) as T
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The coding recommendation service is taking longer than usual. Please try again.")
    }

    if (error instanceof TypeError) {
      throw new Error("Could not reach the coding recommendation service. Check the backend and try again.")
    }

    logClientDebug("Coding API failed", {
      endpoint,
      message: error instanceof Error ? error.message : "Unknown error",
    })
    throw error instanceof Error ? error : new Error("Something went wrong while contacting the coding recommendation service.")
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export function getCodingDifficultyLabel(difficulty: CodingDifficulty | number): string {
  if (difficulty === 1) return "Easy"
  if (difficulty === 2) return "Medium"
  if (difficulty === 3) return "Hard"
  return "Unknown"
}

export async function fetchCodingRecommendation(
  payload: CodingRecommendationRequest
): Promise<CodingRecommendationResponse> {
  try {
    const data = await requestJson<unknown>("/coding/recommend", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    if (!isRecommendationResponse(data)) {
      throw new Error("The coding recommendation service returned an unexpected response.")
    }

    return data
  } catch (error) {
    const fallbackQuestions = getCodingCatalogQuestionsByCompany(payload.target_company).slice(0, 4)
    const primary = fallbackQuestions[0]

    if (!primary) {
      throw error instanceof Error ? error : new Error("The coding recommendation service returned an unexpected response.")
    }

    return {
      user_id: payload.user_id,
      target_company: payload.target_company ?? null,
      focus_topic: primary.topic,
      primary_question: primary,
      easier_questions: fallbackQuestions.filter((question) => question.difficulty < primary.difficulty).slice(0, 2),
      harder_questions: fallbackQuestions.filter((question) => question.difficulty > primary.difficulty).slice(0, 2),
      similar_questions: fallbackQuestions.filter((question) => question.question_id !== primary.question_id).slice(0, 3),
      reason: "Questions loaded from local catalog.",
    }
  }
}

export async function submitCodingAttempt(
  payload: CodingAttemptRequest
): Promise<CodingAttemptResponse> {
  const data = await requestJson<unknown>("/coding/attempt", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  if (!isAttemptResponse(data)) {
    throw new Error("The coding attempt response was not in the expected format.")
  }

  return data
}

export async function fetchCodingUserStats(userId: string): Promise<UserStatsResponse> {
  const data = await requestJson<unknown>(`/coding/user-stats?user_id=${encodeURIComponent(userId)}`, {
    method: "GET",
  })

  if (!isUserStatsResponse(data)) {
    throw new Error("The coding user stats response was not in the expected format.")
  }

  return data
}

export async function fetchCodingHint(
  payload: CodingHintRequest
): Promise<CodingHintResponse> {
  const data = await requestJson<unknown>("/coding/hint", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  if (!isHintResponse(data)) {
    throw new Error("The coding hint response was not in the expected format.")
  }

  return data
}

export async function fetchCodingExplanation(
  payload: CodingExplainRequest
): Promise<CodingExplainResponse> {
  const data = await requestJson<unknown>("/coding/explain", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  if (!isExplainResponse(data)) {
    throw new Error("The coding explanation response was not in the expected format.")
  }

  return data
}

export const getCodingRecommendation = fetchCodingRecommendation
export const getCodingUserStats = fetchCodingUserStats
