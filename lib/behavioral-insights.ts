import { behavioralQuestionsById } from "@/data/behavioral"
import type { BehavioralCategory } from "@/data/types"
import type { SavedBehavioralAttempt } from "@/types/behavioral"

type InsightDimension = "clarity" | "structure" | "impact"
type Momentum = "improving" | "stable" | "slipping"
type CategoryStrengthLabel = "weak" | "average" | "strong"

export type CategoryStat = {
  attempts: number
  avg_clarity: number
  avg_structure: number
  avg_impact: number
  dominant_label: CategoryStrengthLabel
}

export type CategoryStats = Partial<Record<BehavioralCategory, CategoryStat>>

export type BehavioralInsights = {
  strongestDimension: InsightDimension
  weakestDimension: InsightDimension
  mostCommonLabel: string
  recentMomentum: Momentum
  categoryStats: CategoryStats
  strongestCategory: BehavioralCategory | null
  weakestCategory: BehavioralCategory | null
  mostPracticedCategory: BehavioralCategory | null
  leastPracticedCategory: BehavioralCategory | null
  primaryInsight: string
  secondaryInsight: string
  recommendation: string
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function formatLabel(label: string): string {
  return label
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getAttemptCategory(attempt: SavedBehavioralAttempt): BehavioralCategory | null {
  if (attempt.category) {
    return attempt.category
  }

  return behavioralQuestionsById[attempt.questionId]?.category ?? null
}

function getMostCommonLabel(attempts: SavedBehavioralAttempt[]): string {
  const counts = new Map<string, number>()

  for (const attempt of attempts) {
    const label = attempt.display_label || attempt.label
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }

  const topLabel = [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "average"
  return formatLabel(topLabel)
}

function getMomentum(attempts: SavedBehavioralAttempt[]): Momentum {
  if (attempts.length < 4) {
    return "stable"
  }

  const recent = attempts.slice(0, 3)
  const earlier = attempts.slice(3, 6)

  if (earlier.length === 0) {
    return "stable"
  }

  const recentScore = average(
    recent.map((attempt) => attempt.score_clarity + attempt.score_structure + attempt.score_impact)
  )
  const earlierScore = average(
    earlier.map((attempt) => attempt.score_clarity + attempt.score_structure + attempt.score_impact)
  )
  const delta = recentScore - earlierScore

  if (delta >= 1) {
    return "improving"
  }

  if (delta <= -1) {
    return "slipping"
  }

  return "stable"
}

function getDominantLabel(attempts: SavedBehavioralAttempt[]): CategoryStrengthLabel {
  const counts = new Map<CategoryStrengthLabel, number>()

  for (const attempt of attempts) {
    counts.set(attempt.label, (counts.get(attempt.label) ?? 0) + 1)
  }

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "average"
}

function getCategoryOverallScore(stats: CategoryStat): number {
  return (stats.avg_clarity + stats.avg_structure + stats.avg_impact) / 3
}

export function computeCategoryStats(attempts: SavedBehavioralAttempt[]): CategoryStats {
  const categoryBuckets = new Map<BehavioralCategory, SavedBehavioralAttempt[]>()

  for (const attempt of attempts) {
    const category = getAttemptCategory(attempt)
    if (!category) {
      continue
    }

    const existing = categoryBuckets.get(category) ?? []
    categoryBuckets.set(category, [...existing, attempt])
  }

  const categoryStats: CategoryStats = {}

  for (const [category, categoryAttempts] of categoryBuckets.entries()) {
    categoryStats[category] = {
      attempts: categoryAttempts.length,
      avg_clarity: average(categoryAttempts.map((attempt) => attempt.score_clarity)),
      avg_structure: average(categoryAttempts.map((attempt) => attempt.score_structure)),
      avg_impact: average(categoryAttempts.map((attempt) => attempt.score_impact)),
      dominant_label: getDominantLabel(categoryAttempts),
    }
  }

  return categoryStats
}

function getCategoryLeaders(categoryStats: CategoryStats) {
  const entries = Object.entries(categoryStats) as Array<[BehavioralCategory, CategoryStat]>

  if (entries.length === 0) {
    return {
      strongestCategory: null,
      weakestCategory: null,
      mostPracticedCategory: null,
      leastPracticedCategory: null,
    }
  }

  const byOverallScore = [...entries].sort(
    (left, right) => getCategoryOverallScore(right[1]) - getCategoryOverallScore(left[1])
  )
  const byAttempts = [...entries].sort((left, right) => right[1].attempts - left[1].attempts)

  return {
    strongestCategory: byOverallScore[0]?.[0] ?? null,
    weakestCategory: byOverallScore[byOverallScore.length - 1]?.[0] ?? null,
    mostPracticedCategory: byAttempts[0]?.[0] ?? null,
    leastPracticedCategory: byAttempts[byAttempts.length - 1]?.[0] ?? null,
  }
}

function getRecommendation(weakestDimension: InsightDimension, momentum: Momentum): string {
  if (momentum === "slipping") {
    return "Re-attempt a recent answer and tighten the weakest part before moving on."
  }

  if (weakestDimension === "clarity") {
    return "Practice clearer openings and direct answer framing."
  }

  if (weakestDimension === "structure") {
    return "Practice STAR structure for your next answer."
  }

  return "Add measurable outcomes to improve impact."
}

export function computeBehavioralInsights(
  attempts: SavedBehavioralAttempt[]
): BehavioralInsights | null {
  if (attempts.length === 0) {
    return null
  }

  const dimensionAverages = {
    clarity: average(attempts.map((attempt) => attempt.score_clarity)),
    structure: average(attempts.map((attempt) => attempt.score_structure)),
    impact: average(attempts.map((attempt) => attempt.score_impact)),
  }

  const sortedDimensions = Object.entries(dimensionAverages).sort((left, right) => right[1] - left[1]) as Array<
    [InsightDimension, number]
  >
  const strongestDimension = sortedDimensions[0][0]
  const weakestDimension = sortedDimensions[sortedDimensions.length - 1][0]
  const recentMomentum = getMomentum(attempts)
  const mostCommonLabel = getMostCommonLabel(attempts)
  const categoryStats = computeCategoryStats(attempts)
  const {
    strongestCategory,
    weakestCategory,
    mostPracticedCategory,
    leastPracticedCategory,
  } = getCategoryLeaders(categoryStats)

  const primaryInsight = `Your ${strongestDimension} is strongest right now.`
  const secondaryInsight =
    recentMomentum === "improving"
      ? `Recent attempts are improving, but ${weakestDimension} still has the most room to grow.`
      : recentMomentum === "slipping"
        ? `${formatLabel(weakestDimension)} is slipping a bit in recent attempts.`
        : weakestCategory
          ? `${formatLabel(weakestDimension)} looks weakest, especially in ${weakestCategory} prompts.`
          : `${formatLabel(weakestDimension)} is your weakest dimension right now.`

  return {
    strongestDimension,
    weakestDimension,
    mostCommonLabel,
    recentMomentum,
    categoryStats,
    strongestCategory,
    weakestCategory,
    mostPracticedCategory,
    leastPracticedCategory,
    primaryInsight,
    secondaryInsight,
    recommendation: getRecommendation(weakestDimension, recentMomentum),
  }
}
