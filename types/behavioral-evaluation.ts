export type BehavioralEvaluationRequest = {
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

export type BehavioralEvaluationResponse = {
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
