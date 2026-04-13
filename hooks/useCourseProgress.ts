"use client"

import { useEffect, useState } from "react"

import { subscribeToUserProgress, subscribeToUserSessions } from "@/lib/firestore/learningService"
import type { UserProgressRecord, UserSessionRecord } from "@/types/learning"

export function useCourseProgress(uid?: string | null) {
  const [progressMap, setProgressMap] = useState<Record<string, UserProgressRecord>>({})
  const [sessions, setSessions] = useState<UserSessionRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setProgressMap({})
      setSessions([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribers = [
      subscribeToUserProgress(uid, (nextProgress) => {
        setProgressMap(nextProgress)
        setLoading(false)
      }),
      subscribeToUserSessions(uid, (nextSessions) => {
        setSessions(nextSessions)
        setLoading(false)
      }),
    ]

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [uid])

  return {
    progressMap,
    sessions,
    loading,
  }
}

