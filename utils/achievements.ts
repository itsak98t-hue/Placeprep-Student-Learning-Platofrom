import type { AchievementDefinition, AchievementState } from "@/types/dashboard"
import type { UserAnalytics } from "@/utils/computeAnalytics"

const achievementDefinitions: AchievementDefinition[] = [
  {
    id: "first-answer",
    title: "First Answer",
    description: "Answer at least one question to start your journey.",
    progressLabel: (value) => `${Math.min(value, 1)}/1 answer`,
  },
  {
    id: "on-fire",
    title: "On Fire",
    description: "Maintain a streak of at least 3 days.",
    progressLabel: (value) => `${Math.min(value, 3)}/3 streak days`,
  },
  {
    id: "half-way-there",
    title: "Half Way There",
    description: "Cover at least 20 distinct topics.",
    progressLabel: (value) => `${Math.min(value, 20)}/20 topics`,
  },
  {
    id: "sharp-shooter",
    title: "Sharp Shooter",
    description: "Reach at least 80% overall accuracy.",
    progressLabel: (value) => `${Math.min(value, 80)}/80% accuracy`,
  },
  {
    id: "century",
    title: "Century",
    description: "Solve 100 problems correctly.",
    progressLabel: (value) => `${Math.min(value, 100)}/100 solved`,
  },
  {
    id: "course-master",
    title: "Course Master",
    description: "Push any course average to at least 90%.",
    progressLabel: (value) => `${Math.min(value, 90)}/90% course average`,
  },
]

function getBestCourseScore(analytics: UserAnalytics) {
  return Object.values(analytics.courseBreakdown).reduce((best, breakdown) => {
    return Math.max(best, breakdown.avgScore)
  }, 0)
}

export function computeAchievements(
  analytics: UserAnalytics,
  streak: number,
  totalAnswers: number,
  unlockedIds: string[] = []
): AchievementState[] {
  const unlockedSet = new Set(unlockedIds)
  const bestCourseScore = getBestCourseScore(analytics)

  return achievementDefinitions.map((achievement) => {
    let progressValue = 0
    let progressTarget = 1

    switch (achievement.id) {
      case "first-answer":
        progressValue = totalAnswers
        progressTarget = 1
        break
      case "on-fire":
        progressValue = streak
        progressTarget = 3
        break
      case "half-way-there":
        progressValue = analytics.topicsCovered
        progressTarget = 20
        break
      case "sharp-shooter":
        progressValue = analytics.accuracy
        progressTarget = 80
        break
      case "century":
        progressValue = analytics.problemsSolved
        progressTarget = 100
        break
      case "course-master":
        progressValue = bestCourseScore
        progressTarget = 90
        break
      default:
        progressValue = 0
        progressTarget = 1
        break
    }

    return {
      ...achievement,
      unlocked: unlockedSet.has(achievement.id) || progressValue >= progressTarget,
      progressValue,
      progressTarget,
    }
  })
}

export function getUnlockedAchievementIds(achievements: AchievementState[]) {
  return achievements.filter((achievement) => achievement.unlocked).map((achievement) => achievement.id)
}
