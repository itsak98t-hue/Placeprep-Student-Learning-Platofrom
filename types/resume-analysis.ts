export type ResumeScoreBreakdown = {
  label: string
  score: number
  details: string
}

export type ResumeSuggestion = {
  title: string
  detail: string
  severity: "high" | "medium" | "low"
}

export type ResumeAnalysis = {
  score: number
  keywordCoverage: number
  matchedKeywords: string[]
  missingKeywords: string[]
  breakdown: ResumeScoreBreakdown[]
  suggestions: ResumeSuggestion[]
}

export type AiResumeSuggestionResponse = {
  summary: string
  suggestions: ResumeSuggestion[]
  source: "ai" | "heuristic"
}
