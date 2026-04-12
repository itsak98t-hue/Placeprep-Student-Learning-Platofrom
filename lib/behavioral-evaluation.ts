import type {
  BehavioralDisplayLabel,
  BehavioralEvaluation,
  BehavioralEvaluationRequest,
  BehavioralPredictResponse,
  BehavioralRawLabel,
} from "@/types/behavioral"
import { isProd, logClientDebug } from "@/lib/runtime-config"

const REQUEST_TIMEOUT_MS = 45000
const FALLBACK_FEEDBACK = "We couldn't fully evaluate this. Try again."

function isValidLabel(value: unknown): value is BehavioralRawLabel {
  return value === "weak" || value === "average" || value === "strong"
}

function isValidDisplayLabel(value: unknown): value is BehavioralDisplayLabel {
  return (
    value === "weak" ||
    value === "average" ||
    value === "strong" ||
    value === "almost_strong" ||
    value === "borderline_strong" ||
    value === "borderline_average" ||
    value === "Average Answer"
  )
}

function normalizeNumber(value: unknown, fallbackValue: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallbackValue
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeMissing(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
}

function getDisplayLabelFromLabel(label: BehavioralRawLabel): BehavioralDisplayLabel {
  return label
}

function createFallbackBehavioralEvaluation(): BehavioralEvaluation {
  return {
    label: "average",
    display_label: "Average Answer",
    confidence: 0.5,
    class_probabilities: {
      weak: 0.25,
      average: 0.5,
      strong: 0.25,
    },
    score_clarity: 5,
    score_structure: 5,
    score_impact: 5,
    missing: [],
    feedback: FALLBACK_FEEDBACK,
    suggested_improvement: "",
    interpretation: "",
    is_invalid_answer: false,
    validation_message: null,
  }
}

export function normalizeBehavioralEvaluation(response: unknown): BehavioralEvaluation | null {
  if (!response || typeof response !== "object") {
    return null
  }

  const candidate = response as Record<string, unknown>
  const label = isValidLabel(candidate.label) ? candidate.label : "average"
  const displayLabel = isValidDisplayLabel(candidate.display_label)
    ? candidate.display_label
    : getDisplayLabelFromLabel(label)
  const feedback = normalizeString(candidate.feedback)
  const suggestedImprovement = normalizeString(candidate.suggested_improvement)
  const interpretation = normalizeString(candidate.interpretation)
  const missing = normalizeMissing(candidate.missing)
  const scoreClarity = normalizeNumber(candidate.score_clarity, 5)
  const scoreStructure = normalizeNumber(candidate.score_structure, 5)
  const scoreImpact = normalizeNumber(candidate.score_impact, 5)
  const confidence = normalizeNumber(candidate.confidence, 0.5)
  const classProbabilities =
    candidate.class_probabilities && typeof candidate.class_probabilities === "object"
      ? (candidate.class_probabilities as Record<string, unknown>)
      : null
  const isInvalidAnswer = candidate.is_invalid_answer === true
  const validationMessage = normalizeString(candidate.validation_message) || null

  const hasUsableEvaluationData =
    isValidLabel(candidate.label) ||
    typeof candidate.score_clarity === "number" ||
    typeof candidate.score_structure === "number" ||
    typeof candidate.score_impact === "number" ||
    feedback.length > 0 ||
    suggestedImprovement.length > 0 ||
    interpretation.length > 0 ||
    missing.length > 0

  if (!hasUsableEvaluationData) {
    return createFallbackBehavioralEvaluation()
  }

  return {
    label,
    display_label: displayLabel,
    confidence,
    class_probabilities: {
      weak: normalizeNumber(classProbabilities?.weak, 0.25),
      average: normalizeNumber(classProbabilities?.average, 0.5),
      strong: normalizeNumber(classProbabilities?.strong, 0.25),
    },
    score_clarity: scoreClarity,
    score_structure: scoreStructure,
    score_impact: scoreImpact,
    missing,
    feedback,
    suggested_improvement: suggestedImprovement,
    interpretation,
    is_invalid_answer: isInvalidAnswer,
    validation_message: validationMessage,
  }
}

export async function evaluateBehavioralAnswer(
  payload: BehavioralEvaluationRequest
): Promise<BehavioralPredictResponse> {
  const endpoint = "/api/evaluate"
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    logClientDebug("Behavioral evaluation request", {
      endpoint,
      isProd,
    })

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(
        response.status >= 500
          ? "The evaluation service is having trouble right now. Please try again in a moment."
          : "We couldn't evaluate this answer right now. Please try again."
      )
    }

    let data: unknown

    try {
      data = (await response.json()) as unknown
    } catch {
      return createFallbackBehavioralEvaluation()
    }

    const normalized = normalizeBehavioralEvaluation(data)
    logClientDebug("Behavioral evaluation response", {
      endpoint,
      hasNormalizedResponse: Boolean(normalized),
      isInvalidAnswer: normalized?.is_invalid_answer === true,
    })
    return normalized ?? createFallbackBehavioralEvaluation()
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The evaluation is taking longer than usual. Please try again shortly.")
    }

    if (error instanceof TypeError) {
      throw new Error("Could not reach the evaluation service. Please check your connection and try again.")
    }

    logClientDebug("Behavioral evaluation failed", {
      endpoint,
      message: error instanceof Error ? error.message : "Unknown error",
    })
    throw new Error("We couldn't evaluate this answer right now. Please try again.")
  } finally {
    window.clearTimeout(timeoutId)
  }
}
