"use client"

import { useEffect, useMemo, useState } from "react"

import type { BehavioralQuestion, BehavioralCategory } from "@/data/types"
import { readScopedProgress, toggleStoredId, writeScopedProgress } from "@/hooks/progress-storage"

type BehavioralProgressStorage = {
  prepared: string[]
  bookmarked: string[]
}

const STORAGE_KEY = "placeprep-behavioral-progress"

const defaultProgress: BehavioralProgressStorage = {
  prepared: [],
  bookmarked: [],
}

export function useBehavioralProgress(questions?: BehavioralQuestion[]) {
  const [progress, setProgress] = useState<BehavioralProgressStorage>(defaultProgress)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setProgress(readScopedProgress(STORAGE_KEY, defaultProgress))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setProgress(readScopedProgress(STORAGE_KEY, defaultProgress))
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  useEffect(() => {
    if (hydrated) {
      writeScopedProgress(STORAGE_KEY, progress)
    }
  }, [hydrated, progress])

  const questionIds = useMemo(() => new Set((questions || []).map((question) => question.id)), [questions])

  const scopedPrepared = useMemo(
    () => progress.prepared.filter((id) => questionIds.size === 0 || questionIds.has(id)),
    [progress.prepared, questionIds]
  )
  const scopedBookmarked = useMemo(
    () => progress.bookmarked.filter((id) => questionIds.size === 0 || questionIds.has(id)),
    [progress.bookmarked, questionIds]
  )

  const categoryCounts = useMemo(() => {
    const counts = new Map<BehavioralCategory, number>()

    if (!questions) {
      return counts
    }

    const preparedIds = new Set(progress.prepared)
    for (const question of questions) {
      if (preparedIds.has(question.id)) {
        counts.set(question.category, (counts.get(question.category) || 0) + 1)
      }
    }

    return counts
  }, [progress.prepared, questions])

  return {
    hydrated,
    isPrepared: (id: string) => progress.prepared.includes(id),
    isBookmarked: (id: string) => progress.bookmarked.includes(id),
    togglePrepared: (id: string) =>
      setProgress((prev) => ({
        ...prev,
        prepared: toggleStoredId(prev.prepared, id),
      })),
    toggleBookmarked: (id: string) =>
      setProgress((prev) => ({
        ...prev,
        bookmarked: toggleStoredId(prev.bookmarked, id),
      })),
    summary: {
      prepared: scopedPrepared.length,
      bookmarked: scopedBookmarked.length,
      total: questions?.length || 0,
      categoryCounts,
    },
  }
}
