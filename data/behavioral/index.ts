import questionsData from "@/data/questions.json"
import companiesData from "@/data/companies.json"
import type {
  BehavioralCategory,
  BehavioralQuestion,
  BehavioralRecommendedFor,
  CompanySlug,
  QuestionDifficulty,
  QuestionFrequency,
} from "@/data/types"

type BehavioralQuestionRecord = {
  id: string
  company: CompanySlug
  title: string
  question: string
  category: BehavioralCategory
  difficulty: QuestionDifficulty
  frequency: QuestionFrequency
  recommendedFor: BehavioralRecommendedFor[]
}

const questionRecords = questionsData.behavioral as BehavioralQuestionRecord[]

function buildBehavioralQuestion(question: BehavioralQuestionRecord): BehavioralQuestion {
  return {
    id: question.id,
    slug: question.id,
    company: question.company,
    round: "Behavioral",
    category: question.category,
    difficulty: question.difficulty,
    recommended_for: question.recommendedFor,
    frequency: question.frequency,
    title: question.title,
    question: question.question,
    whyItMatters: `${question.category} is a repeated interview signal for ${question.company}.`,
    whatInterviewerLooksFor: [
      "Clear context",
      "Your personal contribution",
      "A visible result or takeaway",
    ],
    answerTips: [
      "Use STAR order.",
      "Keep your role explicit.",
      "End with the outcome or lesson.",
    ],
    sampleFramework: "Situation -> Task -> Action -> Result -> Reflection",
    sourceLabel: "Behavioral dataset",
  }
}

export const behavioralQuestions: BehavioralQuestion[] = questionRecords.map(buildBehavioralQuestion)

export const behavioralQuestionsByCompany = behavioralQuestions.reduce<Record<CompanySlug, BehavioralQuestion[]>>(
  (accumulator, question) => {
    accumulator[question.company].push(question)
    return accumulator
  },
  Object.fromEntries(
    companiesData.map((company) => [company.id, []])
  ) as unknown as Record<CompanySlug, BehavioralQuestion[]>
)

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
  "Initiative",
  "Pressure",
  "Challenge",
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
  initiative: "Initiative",
  pressure: "Pressure",
  challenge: "Challenge",
  "problem-solving": "Problem Solving",
  adaptability: "Adaptability",
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
