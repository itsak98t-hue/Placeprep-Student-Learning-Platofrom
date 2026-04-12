import type { BehavioralEvaluationResponse, BehavioralRawLabel } from "@/types/behavioral-evaluation"

type GroqEvaluationShape = {
  clarity?: number
  relevance?: number
  structure?: number
  impact?: number
  score?: number
  feedback?: string
  improvements?: string[]
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant"
const STAR_PHRASES = ["situation", "task", "action", "result", "responsible", "challenge", "deadline", "learned", "since then"]
const RESULT_PHRASES = ["as a result", "result", "outcome", "therefore", "this helped", "this improved", "we achieved"]
const STOPWORDS = new Set(["a", "an", "and", "the", "to", "of", "in", "for", "on", "at", "with", "about", "tell", "me", "describe", "your", "you"])

function clampScore(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback
  }

  return Math.min(10, Math.max(1, Math.round(value)))
}

function normalizeFeedback(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeImprovements(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
}

function tokenize(text: string) {
  return (text.toLowerCase().match(/[a-z']+/g) ?? []).filter(Boolean)
}

function getQuestionKeywordOverlap(question: string, answer: string) {
  const questionKeywords = tokenize(question).filter((token) => token.length > 3 && !STOPWORDS.has(token))
  if (questionKeywords.length === 0) {
    return 1
  }

  const answerTokens = new Set(tokenize(answer))
  const matched = questionKeywords.filter((token) => answerTokens.has(token))
  return matched.length / questionKeywords.length
}

function countMatches(text: string, phrases: string[]) {
  const normalized = text.toLowerCase()
  return phrases.filter((phrase) => normalized.includes(phrase)).length
}

function deriveImpactScore(answer: string, relevanceScore: number, suggestedImpact?: number) {
  const resultSignalCount = countMatches(answer, RESULT_PHRASES)
  const hasNumbers = /\d/.test(answer)
  const baseImpact = typeof suggestedImpact === "number" ? suggestedImpact : relevanceScore
  let nextImpact = baseImpact

  if (resultSignalCount > 0) {
    nextImpact += 1
  }

  if (hasNumbers) {
    nextImpact += 1
  }

  return clampScore(nextImpact, 5)
}

function deriveLabel(averageScore: number): BehavioralRawLabel {
  if (averageScore < 4) {
    return "weak"
  }

  if (averageScore < 7) {
    return "average"
  }

  return "strong"
}

function deriveProbabilities(label: BehavioralRawLabel, averageScore: number) {
  if (label === "strong") {
    const strong = Math.min(0.84, Math.max(0.74, Number((averageScore / 10).toFixed(2))))
    const average = Number((1 - strong - 0.06).toFixed(2))
    return {
      weak: 0.06,
      average,
      strong,
    }
  }

  if (label === "weak") {
    return {
      weak: 0.8,
      average: 0.15,
      strong: 0.05,
    }
  }

  return {
    weak: 0.2,
    average: 0.65,
    strong: 0.15,
  }
}

function buildMissingPoints(
  answer: string,
  clarity: number,
  structure: number,
  impact: number,
  improvements: string[]
) {
  const missing = new Set<string>()

  if (structure <= 5 || countMatches(answer, STAR_PHRASES) < 2) {
    missing.add("clear situation, action, and result flow")
  }

  if (impact <= 5) {
    missing.add("stronger outcome or measurable result")
  }

  if (!/learned|realized|since then|after that|taught me/i.test(answer)) {
    missing.add("what you learned and what changed afterward")
  }

  if (answer.trim().split(/\s+/).length < 35) {
    missing.add("more specific detail")
  }

  if (!/\b(i|my|me|personally|owned|led|built|implemented|fixed)\b/i.test(answer)) {
    missing.add("your personal contribution")
  }

  improvements.forEach((item) => missing.add(item))

  return Array.from(missing)
}

function buildInterpretation(label: BehavioralRawLabel, clarity: number, structure: number, impact: number) {
  if (label === "strong") {
    return `This answer is strong overall, with especially solid ${clarity >= structure && clarity >= impact ? "clarity" : structure >= impact ? "structure" : "impact"}.`
  }

  if (label === "weak") {
    return "This answer needs more detail, structure, and concrete ownership before it feels interview-ready."
  }

  return "This answer is understandable, but it still needs sharper structure and stronger evidence to feel convincing."
}

function extractJsonObject(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1] ?? raw
  const jsonLike = candidate.match(/\{[\s\S]*\}/)

  return jsonLike?.[0] ?? candidate
}

async function callGroq(question: string, answer: string) {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY.")
  }

  const systemPrompt = [
    "You are an interview evaluator.",
    "Score the answer from 1-10 based on clarity, relevance, structure (STAR method), and impact.",
    "If the answer is gibberish or meaningless, all scores should be 1.",
    "Return JSON only with keys: clarity, relevance, structure, impact, feedback, improvements.",
    "improvements must be an array of short strings.",
  ].join(" ")

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_GROQ_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Question: ${question}\n\nAnswer: ${answer}\n\nReturn JSON only.`,
        },
      ],
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Groq request failed with status ${response.status}: ${detail}`)
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const rawContent = payload.choices?.[0]?.message?.content ?? ""
  const parsed = JSON.parse(extractJsonObject(rawContent)) as GroqEvaluationShape

  return parsed
}

export async function evaluateBehavioralWithGroq(
  question: string,
  answer: string
): Promise<BehavioralEvaluationResponse> {
  const parsed = await callGroq(question, answer)
  const keywordOverlap = getQuestionKeywordOverlap(question, answer)
  const starSignalCount = countMatches(answer, STAR_PHRASES)

  let clarity = clampScore(parsed.clarity ?? parsed.score, 5)
  let relevance = clampScore(parsed.relevance ?? parsed.score, 5)
  let structure = clampScore(parsed.structure ?? parsed.score, 5)

  if (keywordOverlap < 0.2) {
    relevance = clampScore(relevance - 2, relevance)
  } else if (keywordOverlap > 0.45) {
    relevance = clampScore(relevance + 1, relevance)
  }

  if (starSignalCount >= 2) {
    structure = clampScore(structure + 1, structure)
  }

  const impact = deriveImpactScore(answer, relevance, parsed.impact)
  const averageScore = Number(((clarity + structure + impact) / 3).toFixed(1))
  const label = deriveLabel(averageScore)
  const improvements = normalizeImprovements(parsed.improvements)
  const missing = buildMissingPoints(answer, clarity, structure, impact, improvements)
  const feedback =
    normalizeFeedback(parsed.feedback) ||
    (label === "strong"
      ? "Strong answer overall. You show clear ownership, a sensible structure, and a believable outcome."
      : label === "average"
        ? "This answer is understandable, but it needs sharper structure and more concrete evidence."
        : "This answer feels too thin right now. Add clearer context, your actions, and the final result.")

  return {
    label,
    display_label: label,
    confidence: label === "strong" ? 0.82 : label === "average" ? 0.68 : 0.86,
    class_probabilities: deriveProbabilities(label, averageScore),
    score_clarity: clarity,
    score_structure: structure,
    score_impact: impact,
    missing,
    feedback,
    suggested_improvement: missing[0] ?? improvements[0] ?? "",
    interpretation: buildInterpretation(label, clarity, structure, impact),
    is_invalid_answer: false,
    validation_message: null,
  }
}
