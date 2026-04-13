"use client"

import { useEffect, useMemo } from "react"
import { doc, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { computeAchievements, getUnlockedAchievementIds } from "@/utils/achievements"
import type { UserAnalytics } from "@/utils/computeAnalytics"

function areAchievementListsEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }

  return left.every((achievementId, index) => achievementId === right[index])
}

export function useAchievements(
  uid: string | null | undefined,
  analytics: UserAnalytics,
  streak: number,
  totalAnswers: number,
  storedAchievements: string[] = []
) {
  const achievements = useMemo(
    () => computeAchievements(analytics, streak, totalAnswers, storedAchievements),
    [analytics, storedAchievements, streak, totalAnswers]
  )

  useEffect(() => {
    if (!uid) {
      return
    }

    const unlockedIds = getUnlockedAchievementIds(achievements).sort()
    const currentIds = [...storedAchievements].sort()

    if (areAchievementListsEqual(unlockedIds, currentIds)) {
      return
    }

    void setDoc(doc(db, "users", uid), { achievements: unlockedIds }, { merge: true })
  }, [achievements, storedAchievements, uid])

  return achievements
}
