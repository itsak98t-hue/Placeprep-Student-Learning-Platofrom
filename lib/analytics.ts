import { eachDayOfInterval, format, isSameDay, startOfDay, subDays } from "date-fns"

import { getAnswers } from "@/lib/firestore/userDataService"
import type { UserAnswer } from "@/types/answers"

export type TimelinePoint = {
  date: string
  score: number
  activityCount: number
}

export type CategoryStats = {
  codingAvg: number
  aptitudeAvg: number
  behavioralAvg: number
}

export type ProgressStats = {
  totalQuestionsSolved: number
  uniqueTopicsCovered: number
  accuracy: number
  totalAptitudeAttempts: number
}

export type FeedbackInsights = {
  topImprovementAreas: string[]
  latestAnswers: UserAnswer[]
}

function normalizeScore(answer: UserAnswer): number {
  if (typeof answer.score === "number" && Number.isFinite(answer.score)) {
    return answer.score
  }

  if (typeof answer.rating === "number" && Number.isFinite(answer.rating)) {
    return answer.rating
  }

  return 0
}

function toPercent(answer: UserAnswer): number {
  return Math.max(0, Math.min(100, normalizeScore(answer) * 10))
}

function getBehavioralLikeAnswers(answers: UserAnswer[]) {
  return answers.filter(
    (answer) =>
      answer.type === "behavioral" ||
      answer.category === "behavioral" ||
      answer.category === "hr"
  )
}

export async function getPerformanceTimeline(uid: string, dayCount = 8): Promise<TimelinePoint[]> {
  if (!uid) {
    return []
  }

  const answers = await getAnswers(uid)
  const end = startOfDay(new Date())
  const start = subDays(end, dayCount - 1)
  const days = eachDayOfInterval({ start, end })

  return days.map((day) => {
    const dayAnswers = answers.filter((answer) => isSameDay(new Date(answer.createdAt), day))
    if (dayAnswers.length === 0) {
      return {
        date: format(day, "MMM d"),
        score: 0,
        activityCount: 0,
      }
    }

    const averageScore = Math.round(
      dayAnswers.reduce((sum, answer) => sum + toPercent(answer), 0) / dayAnswers.length
    )

    return {
      date: format(day, "MMM d"),
      score: averageScore,
      activityCount: dayAnswers.length,
    }
  })
}

function computeAverage(answers: UserAnswer[]) {
  if (answers.length === 0) {
    return 0
  }

  return Math.round(answers.reduce((sum, answer) => sum + normalizeScore(answer), 0) / answers.length)
}

export async function getCategoryStats(uid: string): Promise<CategoryStats> {
  if (!uid) {
    return {
      codingAvg: 0,
      aptitudeAvg: 0,
      behavioralAvg: 0,
    }
  }

  const answers = await getAnswers(uid)

  return {
    codingAvg: computeAverage(answers.filter((answer) => answer.category === "coding" || answer.type === "coding")),
    aptitudeAvg: computeAverage(answers.filter((answer) => answer.category === "aptitude")),
    behavioralAvg: computeAverage(getBehavioralLikeAnswers(answers)),
  }
}

export async function getProgressStats(uid: string): Promise<ProgressStats> {
  if (!uid) {
    return {
      totalQuestionsSolved: 0,
      uniqueTopicsCovered: 0,
      accuracy: 0,
      totalAptitudeAttempts: 0,
    }
  }

  const answers = await getAnswers(uid)
  const solvedAnswers = answers.filter((answer) => answer.isCorrect === true || answer.status === "solved")
  const topics = new Set(
    answers
      .map((answer) => answer.topic?.trim())
      .filter((topic): topic is string => Boolean(topic))
  )
  const scoredAnswers = answers.filter((answer) => typeof answer.isCorrect === "boolean")
  const accuracy =
    scoredAnswers.length > 0
      ? Math.round((scoredAnswers.filter((answer) => answer.isCorrect).length / scoredAnswers.length) * 100)
      : 0

  return {
    totalQuestionsSolved: solvedAnswers.length,
    uniqueTopicsCovered: topics.size,
    accuracy,
    totalAptitudeAttempts: answers.filter((answer) => answer.category === "aptitude").length,
  }
}

export async function getRecentFeedbackInsights(uid: string): Promise<FeedbackInsights> {
  if (!uid) {
    return {
      topImprovementAreas: [],
      latestAnswers: [],
    }
  }

  const answers = await getAnswers(uid, { limitCount: 5 })
  const weaknesses = new Map<string, number>()

  answers.forEach((answer) => {
    answer.aiFeedback.improvements.forEach((item) => {
      const key = item.trim()
      if (!key) {
        return
      }

      weaknesses.set(key, (weaknesses.get(key) ?? 0) + 1)
    })

    answer.missing?.forEach((item) => {
      const key = item.trim()
      if (!key) {
        return
      }

      weaknesses.set(key, (weaknesses.get(key) ?? 0) + 1)
    })
  })

  const topImprovementAreas = [...weaknesses.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([area]) => area)

  return {
    topImprovementAreas,
    latestAnswers: answers,
  }
}

export async function getConsistencyStreak(uid: string): Promise<number> {
  if (!uid) {
    return 0
  }

  const answers = await getAnswers(uid)
  if (answers.length === 0) {
    return 0
  }

  const activeDays = new Set(
    answers.map((answer) => format(startOfDay(new Date(answer.createdAt)), "yyyy-MM-dd"))
  )

  let streak = 0
  let cursor = startOfDay(new Date())

  while (activeDays.has(format(cursor, "yyyy-MM-dd"))) {
    streak += 1
    cursor = subDays(cursor, 1)
  }

  return streak
}
