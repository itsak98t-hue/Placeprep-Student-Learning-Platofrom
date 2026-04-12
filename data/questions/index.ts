import type {
  CompanySlug,
  InterviewRound,
  PracticeQuestion,
  QuestionDifficulty,
  QuestionTopic,
} from "@/data/types"
import { googleQuestions } from "@/data/questions/google"
import { microsoftQuestions } from "@/data/questions/microsoft"

export const practiceQuestions: PracticeQuestion[] = [...googleQuestions, ...microsoftQuestions]

export const practiceQuestionsByCompany: Record<CompanySlug, PracticeQuestion[]> = {
  google: googleQuestions,
  microsoft: microsoftQuestions,
}

export const practiceQuestionsById = Object.fromEntries(
  practiceQuestions.map((question) => [question.id, question])
) as Record<string, PracticeQuestion>

export const allQuestionRounds: Array<InterviewRound | "All"> = [
  "All",
  "Online Assessment",
  "Technical Round 1",
  "Technical Round 2",
  "Behavioral",
  "Hiring Committee",
]

export const allQuestionDifficulties: Array<QuestionDifficulty | "All"> = [
  "All",
  "Easy",
  "Medium",
  "Hard",
]

export const allQuestionTopics: Array<QuestionTopic | "All"> = [
  "All",
  "Arrays",
  "Strings",
  "Hashing",
  "Linked List",
  "Stack",
  "Queue",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "Binary Search",
  "Intervals",
  "Greedy",
  "Recursion",
  "Behavioral",
]
