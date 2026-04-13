import { eachDayOfInterval, format, isSameDay, startOfDay, subDays } from "date-fns"

import type {
  AnalyticsOverview,
  CourseConfig,
  CourseStatus,
  FirestoreCompany,
  LeaderboardEntry,
  UserProgressRecord,
  UserSessionRecord,
} from "@/types/learning"

export function computeCourseStatus(scores: number[] = [], topicsCompleted = 0, totalTopics = 0): CourseStatus {
  if (topicsCompleted > 0 && totalTopics > 0 && topicsCompleted >= totalTopics) {
    return "completed"
  }

  if (!scores.length && topicsCompleted === 0) {
    return "not-started"
  }

  if (scores.length < 3) {
    return "in-progress"
  }

  const recent = scores.slice(-3)
  return recent[2] > recent[0] ? "improving" : "in-progress"
}

export function mean(values: number[]) {
  if (!values.length) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value))
}

export function normalizeScoreToPercent(score: number) {
  if (!Number.isFinite(score)) {
    return 0
  }

  if (score <= 10) {
    return clampPercent(score * 10)
  }

  return clampPercent(score)
}

export function computeCompletionPercent(progress?: Pick<UserProgressRecord, "topicsCompleted" | "totalTopics"> | null) {
  if (!progress || !progress.totalTopics) {
    return 0
  }

  return Math.round((progress.topicsCompleted.length / progress.totalTopics) * 100)
}

export function computeWeightedAccuracy(sessions: UserSessionRecord[]) {
  const attempts = sessions.filter((session) => session.totalQuestions > 0)
  if (!attempts.length) {
    return 0
  }

  const totalCorrect = attempts.reduce((sum, session) => sum + session.correctAnswers, 0)
  const totalQuestions = attempts.reduce((sum, session) => sum + session.totalQuestions, 0)
  if (!totalQuestions) {
    return 0
  }

  return Math.round((totalCorrect / totalQuestions) * 100)
}

export function computeTopicsCovered(progressMap: Record<string, UserProgressRecord>) {
  return Object.values(progressMap).reduce((sum, progress) => sum + progress.topicsCompleted.length, 0)
}

export function computePerformanceTimeline(sessions: UserSessionRecord[], dayCount = 8) {
  const end = startOfDay(new Date())
  const start = subDays(end, dayCount - 1)
  const days = eachDayOfInterval({ start, end })

  return days.map((day) => {
    const daySessions = sessions.filter((session) => isSameDay(new Date(session.completedAt), day))
    if (!daySessions.length) {
      return {
        date: format(day, "MMM d"),
        score: 0,
        activityCount: 0,
      }
    }

    return {
      date: format(day, "MMM d"),
      score: Math.round(mean(daySessions.map((session) => normalizeScoreToPercent(session.score)))),
      activityCount: daySessions.length,
    }
  })
}

export function computeStreakFromDates(lastActiveDate?: string | null, baseStreak = 0) {
  if (!lastActiveDate) {
    return 0
  }

  const today = format(startOfDay(new Date()), "yyyy-MM-dd")
  const yesterday = format(subDays(startOfDay(new Date()), 1), "yyyy-MM-dd")

  if (lastActiveDate === today) {
    return baseStreak
  }

  if (lastActiveDate === yesterday) {
    return baseStreak
  }

  return 0
}

export function buildAnalyticsOverview(
  progressMap: Record<string, UserProgressRecord>,
  sessions: UserSessionRecord[],
  streak: number
): AnalyticsOverview {
  const recentSessions = [...sessions]
    .sort((left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime())
    .slice(0, 10)

  return {
    avgScore: Math.round(mean(sessions.map((session) => normalizeScoreToPercent(session.score)))),
    accuracy: computeWeightedAccuracy(sessions),
    streak,
    topicsCovered: computeTopicsCovered(progressMap),
    totalSessions: sessions.length,
    averageScoreTrend: computePerformanceTimeline(sessions),
    courseBreakdown: progressMap,
    recentSessions,
  }
}

export function computeReadiness(requiredCourses: string[], userProgress: Record<string, UserProgressRecord>) {
  if (!requiredCourses.length) {
    return 0
  }

  const scores = requiredCourses.map((courseId) => {
    const progress = userProgress[courseId]
    if (!progress) {
      return 0
    }

    return computeCompletionPercent(progress)
  })

  return Math.round(mean(scores))
}

export function computeLatestFeedbackSnippet(sessions: UserSessionRecord[], courseId: string) {
  const latest = [...sessions]
    .filter((session) => session.courseId === courseId && session.aiFeedback)
    .sort((left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime())[0]

  if (!latest?.aiFeedback) {
    return null
  }

  return latest.aiFeedback.length > 80 ? `${latest.aiFeedback.slice(0, 80)}...` : latest.aiFeedback
}

export function mergeCourseConfigWithProgress(
  courses: CourseConfig[],
  progressMap: Record<string, UserProgressRecord>,
  sessions: UserSessionRecord[]
) {
  return courses.map((course) => {
    const progress = progressMap[course.id]
    const scores = progress?.scores ?? sessions.filter((session) => session.courseId === course.id).map((session) => session.score)
    const completedTopics = progress?.topicsCompleted.length ?? 0
    const totalTopics = progress?.totalTopics ?? course.totalTopics
    const status = computeCourseStatus(scores, completedTopics, totalTopics)

    return {
      ...course,
      progress: {
        courseId: course.id,
        topicsCompleted: progress?.topicsCompleted ?? [],
        totalTopics,
        scores,
        lastUpdated: progress?.lastUpdated ?? null,
        status,
      },
      avgScore: Math.round(mean(scores.map(normalizeScoreToPercent))),
      completionPercent: totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0,
      latestFeedbackSnippet: computeLatestFeedbackSnippet(sessions, course.id),
    }
  })
}

export function extractImprovementInsights(sessions: UserSessionRecord[], limit = 3) {
  const phrases = new Map<string, number>()

  sessions.slice(0, 8).forEach((session) => {
    session.aiFeedback
      .split(/[.!?]/)
      .map((segment) => segment.trim())
      .filter(Boolean)
      .forEach((segment) => {
        const normalized = segment.length > 72 ? `${segment.slice(0, 72)}...` : segment
        phrases.set(normalized, (phrases.get(normalized) ?? 0) + 1)
      })
  })

  return [...phrases.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([phrase]) => phrase)
}

export function sortLeaderboard(entries: LeaderboardEntry[]) {
  return [...entries].sort((left, right) => {
    const rightTotalScore = right.totalScore ?? right.rankScore ?? 0
    const leftTotalScore = left.totalScore ?? left.rankScore ?? 0
    if (rightTotalScore !== leftTotalScore) {
      return rightTotalScore - leftTotalScore
    }

    const rightAvgAccuracy = right.avgAccuracy ?? right.avgScore ?? 0
    const leftAvgAccuracy = left.avgAccuracy ?? left.avgScore ?? 0
    if (rightAvgAccuracy !== leftAvgAccuracy) {
      return rightAvgAccuracy - leftAvgAccuracy
    }

    return right.streak - left.streak
  })
}

export function buildCompanyCards(
  companies: FirestoreCompany[],
  progressMap: Record<string, UserProgressRecord>
) {
  return companies.map((company) => ({
    ...company,
    readinessScore: computeReadiness(company.requiredCourses, progressMap),
  }))
}
