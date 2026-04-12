import { addDays, format, subDays } from "date-fns"
import { Timestamp, collection, getDocs, query } from "firebase/firestore"

import { getRecentBehavioralAttemptsForUser } from "@/lib/behavioral-attempts"
import { db } from "@/lib/firebase"
import type { LearningModuleProgress, LearningProgressStatus, PerformanceTimelinePoint } from "@/types/progress"

type ProgressDocument = {
  moduleId: string
  moduleName: string
  completedTopics: number
  totalTopics: number
  completionPercent: number
  averageScore: number
  status: LearningProgressStatus
  updatedAt?: Timestamp | null
  updatedAtMs?: number
}

const DEFAULT_MODULES = [
  { moduleId: "dsa", moduleName: "DSA", totalTopics: 24, completedTopics: 10, averageScore: 72 },
  { moduleId: "aptitude", moduleName: "Aptitude", totalTopics: 18, completedTopics: 7, averageScore: 68 },
  { moduleId: "dbms", moduleName: "DBMS", totalTopics: 12, completedTopics: 5, averageScore: 64 },
  { moduleId: "os", moduleName: "OS", totalTopics: 10, completedTopics: 4, averageScore: 61 },
  { moduleId: "oops", moduleName: "OOPs", totalTopics: 14, completedTopics: 8, averageScore: 74 },
  { moduleId: "behavioral", moduleName: "Behavioral HR", totalTopics: 16, completedTopics: 9, averageScore: 77 },
  { moduleId: "resume", moduleName: "Resume Building", totalTopics: 8, completedTopics: 6, averageScore: 81 },
] as const

export function computeCompletionPercent(completedTopics: number, totalTopics: number): number {
  if (totalTopics <= 0) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round((completedTopics / totalTopics) * 100)))
}

export function computeProgressStatus(
  completionPercent: number,
  averageScore: number
): LearningProgressStatus {
  if (completionPercent < 15) {
    return "Just Started"
  }

  if (averageScore < 55) {
    return "Needs Work"
  }

  if (completionPercent >= 75 && averageScore >= 80) {
    return "Strong"
  }

  if (completionPercent >= 45 || averageScore >= 70) {
    return "Improving"
  }

  return "In Progress"
}

function buildFallbackProgress(): LearningModuleProgress[] {
  return DEFAULT_MODULES.map((module, index) => {
    const completionPercent = computeCompletionPercent(module.completedTopics, module.totalTopics)
    return {
      moduleId: module.moduleId,
      moduleName: module.moduleName,
      completedTopics: module.completedTopics,
      totalTopics: module.totalTopics,
      completionPercent,
      averageScore: module.averageScore,
      status: computeProgressStatus(completionPercent, module.averageScore),
      updatedAt: subDays(new Date(), index * 2).toISOString(),
    }
  })
}

function normalizeProgressDoc(data: ProgressDocument): LearningModuleProgress {
  const completionPercent = computeCompletionPercent(data.completedTopics, data.totalTopics)
  return {
    moduleId: data.moduleId,
    moduleName: data.moduleName,
    completedTopics: data.completedTopics,
    totalTopics: data.totalTopics,
    completionPercent: data.completionPercent || completionPercent,
    averageScore: data.averageScore,
    status: data.status || computeProgressStatus(completionPercent, data.averageScore),
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : typeof data.updatedAtMs === "number"
          ? new Date(data.updatedAtMs).toISOString()
          : undefined,
  }
}

export async function getLearningProgress(userId: string): Promise<LearningModuleProgress[]> {
  if (!userId) {
    return buildFallbackProgress()
  }

  try {
    const snapshot = await getDocs(query(collection(db, "users", userId, "progress")))
    if (snapshot.empty) {
      return buildFallbackProgress()
    }

    return snapshot.docs
      .map((snapshotDoc) => normalizeProgressDoc(snapshotDoc.data() as ProgressDocument))
      .sort((left, right) => left.moduleName.localeCompare(right.moduleName))
  } catch (error) {
    console.error("getLearningProgress failed:", error)
    return buildFallbackProgress()
  }
}

function buildFallbackTimeline(): PerformanceTimelinePoint[] {
  const start = subDays(new Date(), 6)
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index)
    return {
      date: format(date, "MMM d"),
      score: 58 + index * 4,
      activityCount: 1 + (index % 3),
    }
  })
}

export async function getPerformanceTimeline(userId: string): Promise<PerformanceTimelinePoint[]> {
  if (!userId) {
    return buildFallbackTimeline()
  }

  try {
    const attempts = await getRecentBehavioralAttemptsForUser(userId, 12)
    if (attempts.length === 0) {
      return buildFallbackTimeline()
    }

    const grouped = attempts.reduce<Record<string, { scoreTotal: number; count: number }>>((accumulator, attempt) => {
      const key = format(new Date(attempt.createdAt), "MMM d")
      const attemptScore = Math.round(
        ((attempt.score_clarity + attempt.score_structure + attempt.score_impact) / 15) * 100
      )
      accumulator[key] = accumulator[key] ?? { scoreTotal: 0, count: 0 }
      accumulator[key].scoreTotal += attemptScore
      accumulator[key].count += 1
      return accumulator
    }, {})

    const points = Object.entries(grouped).map(([date, value]) => ({
      date,
      score: Math.round(value.scoreTotal / value.count),
      activityCount: value.count,
    }))

    return points.length >= 4 ? points : buildFallbackTimeline()
  } catch (error) {
    console.error("getPerformanceTimeline failed:", error)
    return buildFallbackTimeline()
  }
}
