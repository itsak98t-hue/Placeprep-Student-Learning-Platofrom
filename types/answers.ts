import type { BehavioralCategory } from "@/data/types"
import type { BehavioralDisplayLabel, BehavioralRawLabel } from "@/types/behavioral"
import type { CodingAttemptStatus } from "@/types/coding"

export type StoredAnswerType = "behavioral" | "coding"

export interface UserAnswer {
  id?: string
  type: StoredAnswerType
  question: string
  answer: string
  rating: number
  feedback: string
  company: string
  difficulty?: string | null
  createdAt: string
  questionId?: string | null
  companySlug?: string | null
  category?: BehavioralCategory | null
  label?: BehavioralRawLabel
  displayLabel?: BehavioralDisplayLabel
  confidence?: number
  scoreClarity?: number
  scoreStructure?: number
  scoreImpact?: number
  missing?: string[]
  suggestedImprovement?: string
  interpretation?: string
  status?: CodingAttemptStatus | null
  timeSpentMin?: number
  hintsUsed?: number
}

export interface SaveAnswerResult {
  status: "cloud" | "local"
  answer: UserAnswer
}
