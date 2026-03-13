"use client"

import { useEffect, useMemo, useState } from "react"

import type { PracticeQuestion } from "@/data/types"

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

function normalizeIds(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.filter((item): item is string => typeof item === "string"))]
}

function readProgress(): ProgressStorage {
  if (typeof window === "undefined") {
    return defaultProgress
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultProgress
    }

    const parsed = JSON.parse(raw) as Partial<ProgressStorage>
    return {
      solved: normalizeIds(parsed.solved),
      attempted: normalizeIds(parsed.attempted),
      bookmarked: normalizeIds(parsed.bookmarked),
    }
  } catch {
    return defaultProgress
  }
}

function writeProgress(progress: ProgressStorage) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Ignore storage write failures so the UI remains usable in restricted modes.
  }
}

function toggleId(values: string[], id: string) {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id]
}

export function useQuestionProgress(questions?: PracticeQuestion[]) {
  const [progress, setProgress] = useState<ProgressStorage>(defaultProgress)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setProgress(readProgress())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setProgress(readProgress())
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  useEffect(() => {
    if (hydrated) {
      writeProgress(progress)
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
        solved: toggleId(prev.solved, id),
        attempted: prev.attempted.includes(id) ? prev.attempted : [...prev.attempted, id],
      })),
    toggleAttempted: (id: string) =>
      setProgress((prev) => ({
        ...prev,
        attempted: toggleId(prev.attempted, id),
      })),
    toggleBookmarked: (id: string) =>
      setProgress((prev) => ({
        ...prev,
        bookmarked: toggleId(prev.bookmarked, id),
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
