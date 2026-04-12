"use client"

import { useEffect, useMemo, useState } from "react"

import type { PracticeQuestion } from "@/data/types"
import { readScopedProgress, toggleStoredId, writeScopedProgress } from "@/hooks/progress-storage"

type ProgressStorage = {
  solved: string[]
  attempted: string[]
  bookmarked: string[]
}

const STORAGE_KEY = "placeprep-question-progress"

const defaultProgress: ProgressStorage = {
  solved: [],
  attempted: [],
  bookmarked: [],
}

export function useQuestionProgress(questions?: PracticeQuestion[]) {
  const [progress, setProgress] = useState<ProgressStorage>(defaultProgress)
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

  const scopedSolved = useMemo(
    () => progress.solved.filter((id) => questionIds.size === 0 || questionIds.has(id)),
    [progress.solved, questionIds]
  )
  const scopedAttempted = useMemo(
    () => progress.attempted.filter((id) => questionIds.size === 0 || questionIds.has(id)),
    [progress.attempted, questionIds]
  )
  const scopedBookmarked = useMemo(
    () => progress.bookmarked.filter((id) => questionIds.size === 0 || questionIds.has(id)),
    [progress.bookmarked, questionIds]
  )

  const difficultyCounts = useMemo(() => {
    const counts = { Easy: 0, Medium: 0, Hard: 0 }

    if (!questions) {
      return counts
    }

    const solvedIds = new Set(progress.solved)
    for (const question of questions) {
      if (solvedIds.has(question.id)) {
        counts[question.difficulty] += 1
      }
    }

    return counts
  }, [progress.solved, questions])

  return {
    hydrated,
    progress,
    isSolved: (id: string) => progress.solved.includes(id),
    isAttempted: (id: string) => progress.attempted.includes(id),
    isBookmarked: (id: string) => progress.bookmarked.includes(id),
    toggleSolved: (id: string) =>
      setProgress((prev) => ({
        ...prev,
        solved: toggleStoredId(prev.solved, id),
        attempted: prev.attempted.includes(id) ? prev.attempted : [...prev.attempted, id],
      })),
    toggleAttempted: (id: string) =>
      setProgress((prev) => ({
        ...prev,
        attempted: toggleStoredId(prev.attempted, id),
      })),
    toggleBookmarked: (id: string) =>
      setProgress((prev) => ({
        ...prev,
        bookmarked: toggleStoredId(prev.bookmarked, id),
      })),
    summary: {
      solved: scopedSolved.length,
      attempted: scopedAttempted.length,
      bookmarked: scopedBookmarked.length,
      total: questions?.length || 0,
      easySolved: difficultyCounts.Easy,
      mediumSolved: difficultyCounts.Medium,
      hardSolved: difficultyCounts.Hard,
    },
  }
}
