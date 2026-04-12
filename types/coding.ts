export type CodingDifficulty = 1 | 2 | 3

export type CodingAttemptStatus = "solved" | "partial" | "failed" | "skipped"

export interface CodingQuestion {
  question_id: string
  title: string
  platform: string
  topic: string
  difficulty: CodingDifficulty
  external_link: string
  subtopic: string
  pattern: string
  companies?: string[]
  prerequisites?: string[]
  estimated_time_min?: number
  hint_levels?: string[]
  fallback_question_ids?: string[]
  upgrade_question_ids?: string[]
  similar_question_ids?: string[]
}

export interface CodingRecommendationRequest {
  user_id: string
  target_company?: string
}

export interface CodingRecommendationResponse {
  user_id: string
  target_company?: string | null
  focus_topic: string
  primary_question: CodingQuestion
  easier_questions: CodingQuestion[]
  harder_questions: CodingQuestion[]
  similar_questions: CodingQuestion[]
  reason: string
}

export interface CodingAttemptRequest {
  user_id: string
  question_id: string
  status: CodingAttemptStatus
  time_spent_min: number
  hints_used: number
  confidence: number
}

export interface CodingHintRequest {
  user_id: string
  question_id: string
  status: CodingAttemptStatus
  hint_level: number
}

export interface CodingHintResponse {
  hint: string
  hint_level: number
  source: "groq" | "static"
}

export interface CodingExplainRequest {
  user_id: string
  question_id: string
  status: CodingAttemptStatus
  time_spent_min: number
  hints_used: number
  confidence: number
}

export interface CodingExplainResponse {
  explanation: string
  focus_areas: string[]
  source: "groq" | "fallback"
}

export interface CodingAttemptRecord extends CodingAttemptRequest {
  topic: string
  difficulty: CodingDifficulty
  attempted_at: string
}

export interface CodingAttemptResponse {
  success: boolean
  message: string
  attempt: CodingAttemptRecord
}

export interface UserTopicStats {
  attempted: number
  solved: number
  failed: number
  partial: number
  skipped: number
  success_rate: number
  avg_time_spent: number
  avg_hints_used: number
  recent_fail_rate: number
  recent_partial_rate: number
  mastery_score: number
  weakness_score: number
  inferred_topic_level: number
}

export interface CodingUserSummary {
  total_attempts: number
  total_solved: number
  total_partial: number
  total_failed: number
  total_skipped: number
  tracked_topics: number
  overall_success_rate: number
  avg_time_spent: number
  avg_hints_used: number
  weakest_topic: string | null
  strongest_topic: string | null
  focus_topics: string[]
  recent_struggle_topics: string[]
}

export interface UserStatsResponse {
  user_id: string
  summary: CodingUserSummary
  topic_stats: Record<string, UserTopicStats>
}
