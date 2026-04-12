import type { BehavioralCategory, BehavioralQuestion, CompanySlug, QuestionFrequency } from "@/data/types"
import { googleBehavioralQuestions } from "@/data/behavioral/google"
import { microsoftBehavioralQuestions } from "@/data/behavioral/microsoft"

export const behavioralQuestions: BehavioralQuestion[] = [
  ...googleBehavioralQuestions,
  ...microsoftBehavioralQuestions,
]

export const behavioralQuestionsByCompany: Record<CompanySlug, BehavioralQuestion[]> = {
  google: googleBehavioralQuestions,
  microsoft: microsoftBehavioralQuestions,
}

export const behavioralQuestionsById = Object.fromEntries(
  behavioralQuestions.map((question) => [question.id, question])
) as Record<string, BehavioralQuestion>

export const allBehavioralCategories: Array<BehavioralCategory | "All"> = [
  "All",
  "Leadership",
  "Teamwork",
  "Conflict Resolution",
  "Ownership",
  "Failure",
  "Problem Solving",
  "Adaptability",
  "Communication",
  "Ambiguity",
  "Learning",
]

export const allBehavioralFrequencies: Array<QuestionFrequency | "All"> = [
  "All",
  "High",
  "Medium",
  "Low",
]

const behavioralCategoryParamMap: Record<string, BehavioralCategory> = {
  leadership: "Leadership",
  teamwork: "Teamwork",
  conflict: "Conflict Resolution",
  "conflict-resolution": "Conflict Resolution",
  ownership: "Ownership",
  failure: "Failure",
  "problem-solving": "Problem Solving",
  challenge: "Problem Solving",
  adaptability: "Adaptability",
  pressure: "Adaptability",
  communication: "Communication",
  ambiguity: "Ambiguity",
  learning: "Learning",
}

function normalizeCategoryParam(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, "-")
}

export function parseBehavioralCategoryParam(value: string | null | undefined): BehavioralCategory | null {
  if (!value) {
    return null
  }

  const normalizedValue = normalizeCategoryParam(value)
  return behavioralCategoryParamMap[normalizedValue] ?? null
}

export function filterBehavioralQuestionsByCategory(
  questions: BehavioralQuestion[],
  category: BehavioralCategory | null
) {
  if (!category) {
    return questions
  }

  return questions.filter((question) => question.category === category)
}

function getFrequencyRank(frequency: QuestionFrequency): number {
  if (frequency === "High") {
    return 3
  }

  if (frequency === "Medium") {
    return 2
  }

  return 1
}

export function rankBehavioralQuestions(
  questions: BehavioralQuestion[],
  weakestCategory: BehavioralCategory | null
) {
  return [...questions].sort((left, right) => {
    const leftMatchesWeakCategory = weakestCategory !== null && left.category === weakestCategory ? 1 : 0
    const rightMatchesWeakCategory = weakestCategory !== null && right.category === weakestCategory ? 1 : 0

    if (leftMatchesWeakCategory !== rightMatchesWeakCategory) {
      return rightMatchesWeakCategory - leftMatchesWeakCategory
    }

    const frequencyDelta = getFrequencyRank(right.frequency) - getFrequencyRank(left.frequency)
    if (frequencyDelta !== 0) {
      return frequencyDelta
    }

    return left.title.localeCompare(right.title)
  })
}

export function filterBehavioralQuestions(
  questions: BehavioralQuestion[],
  filters: {
    category: BehavioralCategory | "All"
    frequency: QuestionFrequency | "All"
  }
) {
  return questions.filter((question) => {
    const matchesCategory = filters.category === "All" || question.category === filters.category
    const matchesFrequency = filters.frequency === "All" || question.frequency === filters.frequency

    return matchesCategory && matchesFrequency
  })
}
