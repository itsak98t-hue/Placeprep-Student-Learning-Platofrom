"use client"

import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { PlatformStats } from "@/types/dashboard"

const defaultStats: PlatformStats = {
  totalUsers: 0,
  totalAnswers: 0,
  avgPlatformScore: 0,
}

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats>(defaultStats)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "platform_stats", "global"), (snapshot) => {
      if (!snapshot.exists()) {
        setStats(defaultStats)
        setLoading(false)
        return
      }

      const data = snapshot.data()
      setStats({
        totalUsers: Number(data.totalUsers ?? 0),
        totalAnswers: Number(data.totalAnswers ?? 0),
        avgPlatformScore: Number(data.avgPlatformScore ?? 0),
        lastUpdated: data.lastUpdated,
      })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { stats, loading }
}
