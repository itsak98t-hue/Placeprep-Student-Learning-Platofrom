"use client"

import { useEffect, useState } from "react"
import { collection, doc, limit, onSnapshot, orderBy, query } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { LeaderboardEntry } from "@/types/learning"

function mapLeaderboardEntry(
  id: string,
  data: Record<string, unknown>
): LeaderboardEntry {
  return {
    uid: String(data.uid ?? id),
    displayName: String(data.displayName ?? "Anonymous"),
    tier: String(data.tier ?? "Tier 1"),
    avgScore: Number(data.avgScore ?? 0),
    streak: Number(data.streak ?? 0),
    photoURL: typeof data.photoURL === "string" ? data.photoURL : null,
    problemsSolved: Number(data.problemsSolved ?? 0),
    rankScore: Number(data.rankScore ?? 0),
    lastUpdated:
      typeof (data.lastUpdated as { toDate?: () => Date } | undefined)?.toDate === "function"
        ? (data.lastUpdated as { toDate: () => Date }).toDate().toISOString()
        : null,
  }
}

export function useLeaderboard(currentUid?: string | null) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let currentUserEntry: LeaderboardEntry | null = null

    const rebuildEntries = (topEntries: LeaderboardEntry[]) => {
      const merged = [...topEntries]
      if (currentUserEntry && !merged.some((entry) => entry.uid === currentUserEntry?.uid)) {
        merged.push(currentUserEntry)
      }

      merged.sort((left, right) => (right.rankScore ?? 0) - (left.rankScore ?? 0))
      setEntries(merged)
      setLoading(false)
    }

    let latestTopEntries: LeaderboardEntry[] = []
    const unsubscribeTop = onSnapshot(
      query(collection(db, "leaderboard"), orderBy("rankScore", "desc"), limit(50)),
      (snapshot) => {
        latestTopEntries = snapshot.docs.map((entryDoc) =>
          mapLeaderboardEntry(entryDoc.id, entryDoc.data() as Record<string, unknown>)
        )
        rebuildEntries(latestTopEntries)
      }
    )

    const unsubscribeCurrent = currentUid
      ? onSnapshot(doc(db, "leaderboard", currentUid), (snapshot) => {
          currentUserEntry = snapshot.exists()
            ? mapLeaderboardEntry(snapshot.id, snapshot.data() as Record<string, unknown>)
            : null
          rebuildEntries(latestTopEntries)
        })
      : () => undefined

    return () => {
      unsubscribeTop()
      unsubscribeCurrent()
    }
  }, [currentUid])

  return { entries, loading }
}
