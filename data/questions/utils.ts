import companiesData from "@/data/companies.json"
import type {
  CompanySlug,
  InterviewRound,
  PracticeQuestion,
  QuestionDifficulty,
  QuestionTopic,
} from "@/data/types"

const companySlugSet = new Set(
  companiesData.map((company) => company.id as CompanySlug)
)

export function isPracticeCompanySlug(value: string): value is CompanySlug {
  return companySlugSet.has(value as CompanySlug)
}

export function filterPracticeQuestions(
  questions: PracticeQuestion[],
  filters: {
    round: InterviewRound | "All"
    difficulty: QuestionDifficulty | "All"
    topic: QuestionTopic | "All"
  }
) {
  return questions.filter((question) => {
    const roundOk = filters.round === "All" || question.round === filters.round
    const difficultyOk = filters.difficulty === "All" || question.difficulty === filters.difficulty
    const topicOk = filters.topic === "All" || question.topic === filters.topic

    return roundOk && difficultyOk && topicOk
  })
}
