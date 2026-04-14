export type ResumeSuggestion = {
  title: string
  detail: string
  severity: "high" | "medium" | "low"
}

export type AtsBreakdown = {
  sectionCompleteness: number
  keywordMatch: number
  formattingSafety: number
  contentStrength: number
  quantifiedImpact: number
  roleRelevance: number
}

export type AtsBreakdownKey = keyof AtsBreakdown

export type ATSAnalysisResult = {
  overallScore: number
  breakdown: AtsBreakdown
  missingKeywords: string[]
  matchedKeywords: string[]
  weakBullets: string[]
  suggestions: string[]
  keywordCoverage: number
}

export type AiResumeSuggestionResponse = {
  summary: string
  suggestions: ResumeSuggestion[]
  source: "ai" | "heuristic"
  atsScore: number
  keywords: {
    found: string[]
    missing: string[]
  }
  sections: Array<{
    name: string
    score: number
    feedback: string
  }>
}
