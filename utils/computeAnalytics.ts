import type { UserAnswer } from "@/types/answers"
import type { CourseConfig } from "@/types/learning"
import type { LearningModuleProgress, PerformanceTimelinePoint } from "@/types/progress"

export type AnalyticsCourseStatus = "not-started" | "in-progress" | "improving" | "completed"

export interface UserAnalytics {
  avgScore: number
  accuracy: number
  topicsCovered: number
  problemsSolved: number
  courseBreakdown: {
    [courseId: string]: {
      avgScore: number
      accuracy: number
      topicsCovered: number
      answersCount: number
      status: AnalyticsCourseStatus
    }
  }
}

function formatTimelineDate(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

function normalizeAnswerScore(answer: UserAnswer) {
  if (typeof answer.score === "number") {
    return answer.score
  }

  if (typeof answer.rating === "number") {
    return answer.rating <= 10 ? answer.rating * 10 : answer.rating
  }

  return 0
}

function getCourseStatus(scores: number[]): AnalyticsCourseStatus {
  if (!scores.length) {
    return "not-started"
  }

  const avg = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  if (avg >= 90) {
    return "completed"
  }

  const recent = scores.slice(-3)
  const prev = scores.slice(-6, -3)
  const recentAvg = recent.reduce((sum, score) => sum + score, 0) / (recent.length || 1)
  const prevAvg = prev.length
    ? prev.reduce((sum, score) => sum + score, 0) / prev.length
    : 0

  return recentAvg > prevAvg ? "improving" : "in-progress"
}

export function computeAnalytics(answers: UserAnswer[]): UserAnalytics {
  if (answers.length === 0) {
    return {
      avgScore: 0,
      accuracy: 0,
      topicsCovered: 0,
      problemsSolved: 0,
      courseBreakdown: {},
    }
  }

  const normalizedAnswers = answers.map((answer) => ({
    ...answer,
    normalizedScore: normalizeAnswerScore(answer),
  }))

  const avgScore = Math.round(
    normalizedAnswers.reduce((sum, answer) => sum + answer.normalizedScore, 0) / normalizedAnswers.length
  )

  const solvedAnswers = normalizedAnswers.filter((answer) => answer.isCorrect === true)
  const accuracy = Math.round((solvedAnswers.length / normalizedAnswers.length) * 100)
  const topicsCovered = new Set(
    normalizedAnswers.map((answer) => `${answer.courseId ?? "general"}:${answer.topicId ?? answer.topic ?? "general"}`)
  ).size
  const problemsSolved = solvedAnswers.length

  const courseBreakdown: UserAnalytics["courseBreakdown"] = {}
  const courseIds = [...new Set(normalizedAnswers.map((answer) => answer.courseId).filter(Boolean))] as string[]

  for (const courseId of courseIds) {
    const courseAnswers = normalizedAnswers.filter((answer) => answer.courseId === courseId)
    const courseAvg = Math.round(
      courseAnswers.reduce((sum, answer) => sum + answer.normalizedScore, 0) / courseAnswers.length
    )
    const courseAccuracy = Math.round(
      (courseAnswers.filter((answer) => answer.isCorrect === true).length / courseAnswers.length) * 100
    )
    const courseTopics = new Set(courseAnswers.map((answer) => answer.topicId ?? answer.topic ?? "general")).size

    courseBreakdown[courseId] = {
      avgScore: courseAvg,
      accuracy: courseAccuracy,
      topicsCovered: courseTopics,
      answersCount: courseAnswers.length,
      status: getCourseStatus(courseAnswers.map((answer) => answer.normalizedScore)),
    }
  }

  return {
    avgScore,
    accuracy,
    topicsCovered,
    problemsSolved,
    courseBreakdown,
  }
}

export function buildPerformanceTimeline(
  answers: UserAnswer[],
  dayCount = 7
): PerformanceTimelinePoint[] {
  if (answers.length === 0) {
    return []
  }

  const today = new Date()
  const dates = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (dayCount - index - 1))
    return date
  })

  return dates.map((date) => {
    const key = date.toISOString().slice(0, 10)
    const dayAnswers = answers.filter((answer) => {
      const answerDate = new Date(answer.answeredAt ?? answer.createdAt)
      return answerDate.toISOString().slice(0, 10) === key
    })

    const score =
      dayAnswers.length > 0
        ? Math.round(
            dayAnswers.reduce((sum, answer) => sum + normalizeAnswerScore(answer), 0) / dayAnswers.length
          )
        : 0

    return {
      date: formatTimelineDate(date),
      score,
      activityCount: dayAnswers.length,
    }
  })
}

function normalizeLearningStatus(status?: AnalyticsCourseStatus): LearningModuleProgress["status"] {
  switch (status) {
    case "completed":
      return "Completed"
    case "improving":
      return "Improving"
    case "in-progress":
      return "In Progress"
    case "not-started":
    default:
      return "Not Started"
  }
}

export function buildLearningModules(
  courses: CourseConfig[],
  analytics: UserAnalytics
): LearningModuleProgress[] {
  return courses.map((course) => {
    const breakdown = analytics.courseBreakdown[course.id]
    const completedTopics = breakdown?.topicsCovered ?? 0
    const completionPercent =
      course.totalTopics > 0 ? Math.min(100, Math.round((completedTopics / course.totalTopics) * 100)) : 0

    return {
      moduleId: course.id,
      moduleName: course.label,
      completedTopics,
      totalTopics: course.totalTopics,
      completionPercent,
      averageScore: breakdown?.avgScore ?? 0,
      status: normalizeLearningStatus(breakdown?.status),
    }
  })
}
