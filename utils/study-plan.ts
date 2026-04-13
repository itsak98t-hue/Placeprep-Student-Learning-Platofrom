import type { CourseConfig } from "@/types/learning"
import type { UserAnalytics } from "@/utils/computeAnalytics"

function getWeekNumber(date: Date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function getCurrentWeekId(date = new Date()) {
  const week = getWeekNumber(date)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}

export function buildStudyPlanInputs(
  analytics: UserAnalytics,
  courses: CourseConfig[],
  streak: number
) {
  const recommendedCourses = courses
    .map((course) => {
      const breakdown = analytics.courseBreakdown[course.id]
      const avgScore = breakdown?.avgScore ?? 0
      const topicsCovered = breakdown?.topicsCovered ?? 0
      const missingTopics = (course.topics ?? []).slice(topicsCovered)

      return {
        courseId: course.id,
        label: course.label,
        avgScore,
        missingTopics,
      }
    })
    .sort((left, right) => left.avgScore - right.avgScore)
    .slice(0, 3)

  const focusTopics = recommendedCourses
    .flatMap((course) => course.missingTopics.slice(0, 3).map((topic) => `${course.label}: ${topic}`))
    .slice(0, 6)

  const dailyGoal = streak >= 5 ? 6 : streak >= 3 ? 5 : 4

  return {
    recommendedCourses: recommendedCourses.map((course) => course.courseId),
    dailyGoal,
    focusTopics,
    weakCourseBreakdown: recommendedCourses.map((course) => ({
      courseId: course.courseId,
      label: course.label,
      avgScore: course.avgScore,
      topicsCovered: analytics.courseBreakdown[course.courseId]?.topicsCovered ?? 0,
      answersCount: analytics.courseBreakdown[course.courseId]?.answersCount ?? 0,
    })),
  }
}
