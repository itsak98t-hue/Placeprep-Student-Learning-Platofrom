import type {
  CompanySlug,
  InterviewRound,
  PracticeQuestion,
  QuestionDifficulty,
  QuestionTopic,
} from "@/data/types"

export function isPracticeCompanySlug(value: string): value is CompanySlug {
  return value === "google" || value === "microsoft"
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
