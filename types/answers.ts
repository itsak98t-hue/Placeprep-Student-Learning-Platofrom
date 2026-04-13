import type { BehavioralCategory } from "@/data/types"
import type { BehavioralDisplayLabel, BehavioralRawLabel } from "@/types/behavioral"
import type { CodingAttemptStatus } from "@/types/coding"

export type StoredAnswerType = "behavioral" | "coding" | "technical" | "aptitude" | "hr"

export type AnswerCategory = "coding" | "aptitude" | "technical" | "hr" | "behavioral"

export interface AIFeedback {
  strengths: string[]
  improvements: string[]
  suggestions: string[]
  ratingExplanation: string
}

export interface UserAnswer {
  id?: string
  uid?: string | null
  type: StoredAnswerType
  questionId?: string | null
  question: string
  questionText?: string
  answer: string
  rating: number
  score?: number
  feedback: string
  company: string
  category: AnswerCategory
  topic?: string | null
  difficulty?: string | null
  isCorrect?: boolean | null
  timeTakenSeconds?: number | null
  createdAt: string
  answeredAt?: string
  courseId?: string | null
  topicId?: string | null
  sessionId?: string | null
  companySlug?: string | null
  behavioralCategory?: BehavioralCategory | null
  label?: BehavioralRawLabel
  displayLabel?: BehavioralDisplayLabel
  confidence?: number
  scoreClarity?: number
  scoreStructure?: number
  scoreImpact?: number
  missing?: string[]
  suggestedImprovement?: string
  interpretation?: string
  aiFeedback: AIFeedback
  status?: CodingAttemptStatus | null
  timeSpentMin?: number
  hintsUsed?: number
}

export interface SaveAnswerResult {
  status: "cloud" | "local"
  answer: UserAnswer
}
