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
