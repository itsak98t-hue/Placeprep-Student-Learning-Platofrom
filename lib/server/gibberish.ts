const COMMON_WORDS = new Set([
  "a", "about", "after", "all", "also", "an", "and", "answer", "approach", "as", "at",
  "because", "before", "better", "blocker", "build", "built", "by", "challenge", "clear",
  "collaborated", "communicated", "company", "conflict", "context", "created", "deadline",
  "delivered", "describe", "design", "developed", "did", "during", "each", "end", "example",
  "experience", "explained", "faced", "failed", "feedback", "for", "from", "goal", "had",
  "handled", "have", "helped", "how", "i", "improved", "in", "internship", "into", "is",
  "issue", "it", "learned", "led", "made", "manage", "managed", "me", "mentor", "met",
  "metric", "my", "of", "on", "one", "organized", "our", "outcome", "owned", "personally",
  "plan", "problem", "process", "project", "relevant", "resolved", "result", "role", "situation",
  "so", "solved", "specific", "star", "structured", "success", "supported", "task", "team",
  "teammate", "that", "the", "then", "there", "this", "through", "time", "to", "took",
  "under", "used", "we", "what", "when", "with", "work", "worked", "would", "you",
])

const VERB_HINTS = [
  "built", "created", "led", "managed", "organized", "improved", "solved", "implemented",
  "fixed", "coordinated", "communicated", "designed", "shipped", "owned", "delivered",
  "supported", "planned", "learned", "handled", "resolved", "analyzed", "tested",
]

const NOUN_HINTS = [
  "project", "team", "deadline", "customer", "feature", "bug", "service", "internship",
  "manager", "interviewer", "system", "product", "result", "outcome", "challenge", "task",
]

export type GibberishAnalysis = {
  isGibberish: boolean
  reason: string | null
  wordCount: number
  uniqueWordRatio: number
  dictionaryWordRatio: number
  hasVerbSignal: boolean
  hasNounSignal: boolean
}

function tokenize(text: string) {
  return (text.toLowerCase().match(/[a-z']+/g) ?? []).filter(Boolean)
}

function hasRepeatedCharacters(text: string) {
  return /(.)\1{3,}/i.test(text)
}

function getDictionaryWordRatio(tokens: string[]) {
  if (tokens.length === 0) {
    return 0
  }

  const dictionaryMatches = tokens.filter((token) => {
    return COMMON_WORDS.has(token) || token.length >= 5 || /(ed|ing)$/.test(token)
  })

  return dictionaryMatches.length / tokens.length
}

export function analyzeGibberish(text: string): GibberishAnalysis {
  const normalized = text.trim()
  const tokens = tokenize(normalized)
  const uniqueWordRatio = tokens.length > 0 ? new Set(tokens).size / tokens.length : 0
  const dictionaryWordRatio = getDictionaryWordRatio(tokens)
  const repeatedWordRatio =
    tokens.length > 0 ? 1 - uniqueWordRatio : 1
  const hasVerbSignal = VERB_HINTS.some((verb) => tokens.includes(verb))
  const hasNounSignal = NOUN_HINTS.some((noun) => tokens.includes(noun))

  if (normalized.length < 20) {
    return {
      isGibberish: true,
      reason: "Answer is too short to evaluate meaningfully.",
      wordCount: tokens.length,
      uniqueWordRatio,
      dictionaryWordRatio,
      hasVerbSignal,
      hasNounSignal,
    }
  }

  if (tokens.length < 20) {
    return {
      isGibberish: true,
      reason: "Please add more detail so the answer is meaningful.",
      wordCount: tokens.length,
      uniqueWordRatio,
      dictionaryWordRatio,
      hasVerbSignal,
      hasNounSignal,
    }
  }

  if (hasRepeatedCharacters(normalized)) {
    return {
      isGibberish: true,
      reason: "The answer contains repeated characters and does not read clearly.",
      wordCount: tokens.length,
      uniqueWordRatio,
      dictionaryWordRatio,
      hasVerbSignal,
      hasNounSignal,
    }
  }

  if (dictionaryWordRatio < 0.35) {
    return {
      isGibberish: true,
      reason: "The answer does not contain enough meaningful English words.",
      wordCount: tokens.length,
      uniqueWordRatio,
      dictionaryWordRatio,
      hasVerbSignal,
      hasNounSignal,
    }
  }

  if (repeatedWordRatio > 0.55) {
    return {
      isGibberish: true,
      reason: "The answer repeats too much to be evaluated well.",
      wordCount: tokens.length,
      uniqueWordRatio,
      dictionaryWordRatio,
      hasVerbSignal,
      hasNounSignal,
    }
  }

  if (!hasVerbSignal || !hasNounSignal) {
    return {
      isGibberish: true,
      reason: "The answer needs a clearer action and context before it can be evaluated.",
      wordCount: tokens.length,
      uniqueWordRatio,
      dictionaryWordRatio,
      hasVerbSignal,
      hasNounSignal,
    }
  }

  return {
    isGibberish: false,
    reason: null,
    wordCount: tokens.length,
    uniqueWordRatio,
    dictionaryWordRatio,
    hasVerbSignal,
    hasNounSignal,
  }
}

export function isGibberish(text: string) {
  return analyzeGibberish(text).isGibberish
}
