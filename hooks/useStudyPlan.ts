"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { StudyPlanDoc } from "@/types/dashboard"
import type { CourseConfig } from "@/types/learning"
import type { UserAnalytics } from "@/utils/computeAnalytics"
import { buildStudyPlanInputs, getCurrentWeekId } from "@/utils/study-plan"

function isOlderThanSevenDays(isoString: string | null) {
  if (!isoString) {
    return true
  }

  return Date.now() - new Date(isoString).getTime() > 7 * 24 * 60 * 60 * 1000
}

export function useStudyPlan(
  uid: string | null | undefined,
  analytics: UserAnalytics,
  courses: CourseConfig[],
  streak: number
) {
  const [studyPlan, setStudyPlan] = useState<(StudyPlanDoc & { generatedAtIso: string | null }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weekId = useMemo(() => getCurrentWeekId(), [])
  const planInputs = useMemo(() => buildStudyPlanInputs(analytics, courses, streak), [analytics, courses, streak])

  const generatePlan = useCallback(
    async (forceRefresh = false) => {
      if (!uid || courses.length === 0) {
        return
      }

      if (!forceRefresh && planInputs.recommendedCourses.length === 0 && planInputs.focusTopics.length === 0) {
        return
      }

      setRefreshing(true)
      setError(null)

      try {
        const response = await fetch("/api/study-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseBreakdown: planInputs.weakCourseBreakdown,
            streak,
            focusTopics: planInputs.focusTopics,
            dailyGoal: planInputs.dailyGoal,
          }),
        })

        if (!response.ok) {
          throw new Error("Could not generate a study plan right now.")
        }

        const data = (await response.json()) as { planText: string }
        await setDoc(
          doc(db, "users", uid, "study_plan", weekId),
          {
            weekId,
            recommendedCourses: planInputs.recommendedCourses,
            dailyGoal: planInputs.dailyGoal,
            focusTopics: planInputs.focusTopics,
            planText: data.planText,
            generatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } catch (generationError) {
        setError(
          generationError instanceof Error
            ? generationError.message
            : "Could not generate a study plan right now."
        )
      } finally {
        setRefreshing(false)
      }
    },
    [courses.length, planInputs.dailyGoal, planInputs.focusTopics, planInputs.recommendedCourses, planInputs.weakCourseBreakdown, streak, uid, weekId]
  )

  useEffect(() => {
    if (!uid) {
      setStudyPlan(null)
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(doc(db, "users", uid, "study_plan", weekId), (snapshot) => {
      if (!snapshot.exists()) {
        setStudyPlan(null)
        setLoading(false)
        return
      }

      const data = snapshot.data()
      const generatedAtIso =
        typeof data.generatedAt?.toDate === "function" ? data.generatedAt.toDate().toISOString() : null

      setStudyPlan({
        weekId: String(data.weekId ?? weekId),
        recommendedCourses: Array.isArray(data.recommendedCourses)
          ? data.recommendedCourses.filter((courseId): courseId is string => typeof courseId === "string")
          : [],
        dailyGoal: typeof data.dailyGoal === "number" ? data.dailyGoal : 0,
        focusTopics: Array.isArray(data.focusTopics)
          ? data.focusTopics.filter((topic): topic is string => typeof topic === "string")
          : [],
        planText: typeof data.planText === "string" ? data.planText : "",
        generatedAt: data.generatedAt,
        generatedAtIso,
      })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [uid, weekId])

  useEffect(() => {
    if (loading || refreshing || !uid || courses.length === 0) {
      return
    }

    if (!studyPlan) {
      void generatePlan(false)
      return
    }

    if (isOlderThanSevenDays(studyPlan.generatedAtIso)) {
      void generatePlan(true)
    }
  }, [courses.length, generatePlan, loading, refreshing, studyPlan, uid])

  return {
    weekId,
    studyPlan,
    loading,
    refreshing,
    error,
    refreshPlan: () => generatePlan(true),
  }
}
