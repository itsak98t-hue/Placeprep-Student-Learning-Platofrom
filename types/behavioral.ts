import type { BehavioralCategory } from "@/data/types"

export interface BehavioralEvaluationRequest {
  question: string
  answer: string
}

export type BehavioralRawLabel = "weak" | "average" | "strong"

export type BehavioralDisplayLabel =
  | "weak"
  | "average"
  | "strong"
  | "almost_strong"
  | "borderline_strong"
  | "borderline_average"
  | "Average Answer"

export interface BehavioralPredictResponse {
  label: BehavioralRawLabel
  display_label: BehavioralDisplayLabel
  confidence: number
  class_probabilities: {
    weak: number
    average: number
    strong: number
  }
  score_clarity: number
  score_structure: number
  score_impact: number
  missing: string[]
  feedback: string
  suggested_improvement: string
  interpretation: string
  is_invalid_answer?: boolean
  validation_message?: string | null
}

export interface BehavioralEvaluation {
  label: BehavioralRawLabel
  display_label: BehavioralDisplayLabel
  confidence: number
  class_probabilities: {
    weak: number
    average: number
    strong: number
  }
  score_clarity: number
  score_structure: number
  score_impact: number
  missing: string[]
  feedback: string
  suggested_improvement: string
  interpretation: string
  is_invalid_answer?: boolean
  validation_message?: string | null
}

export interface BehavioralAttempt {
  questionId: string
  questionText: string
  answer: string
  label: BehavioralRawLabel
  displayLabel: BehavioralDisplayLabel
  confidence: number
  scoreClarity: number
  scoreStructure: number
  scoreImpact: number
  missing: string[]
  feedback: string
  suggestedImprovement: string
  interpretation: string
  createdAt: string
  companySlug?: string | null
  category?: BehavioralCategory | null
}

export interface SaveAttemptResult {
  status: "cloud" | "local"
  attempt: SavedBehavioralAttempt
}

export interface SavedBehavioralAttempt {
  id: string
  userId: string
  questionId: string
  questionText: string
  answerText: string
  category: BehavioralCategory | null
  label: BehavioralRawLabel
  display_label: BehavioralDisplayLabel
  confidence: number
  score_clarity: number
  score_structure: number
  score_impact: number
  feedback: string
  suggested_improvement: string
  interpretation: string
  missing: string[]
  createdAt: string
  updatedAt: string | null
}
