const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
  "using",
  "used",
  "build",
  "role",
  "job",
  "experience",
  "team",
  "candidate",
  "preferred",
  "strong",
  "knowledge",
])

export function sanitizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s/-]/g, " ")
}

export function extractJobKeywords(jobDescription: string): string[] {
  const tokens = sanitizeText(jobDescription)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))

  const frequency = new Map<string, number>()
  for (const token of tokens) {
    frequency.set(token, (frequency.get(token) ?? 0) + 1)
  }

  return [...frequency.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 18)
    .map(([token]) => token)
}

export function matchKeywords(resumeText: string, jobKeywords: string[]) {
  const matchedKeywords = jobKeywords.filter((keyword) => resumeText.includes(keyword))
  const missingKeywords = jobKeywords.filter((keyword) => !resumeText.includes(keyword))

  return {
    matchedKeywords,
    missingKeywords,
    coverage: jobKeywords.length > 0 ? Math.round((matchedKeywords.length / jobKeywords.length) * 100) : 0,
  }
}
