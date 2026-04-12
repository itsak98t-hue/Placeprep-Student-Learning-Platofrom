"use client"

import { useCallback, useMemo, useRef, useState } from "react"

import {
  createResume,
  deleteResume,
  duplicateResume,
  getResumeById,
  setDefaultResume,
} from "@/lib/firestore/resumeService"
import {
  getResumes as getUserResumes,
  saveResume as saveUserResume,
} from "@/lib/firestore/userDataService"
import { createEmptyResume, normalizeResume } from "@/lib/resume"
import type { Resume, ResumeInput, ResumeListItem } from "@/types/resume"

type ResumesState = {
  resumes: ResumeListItem[]
  selectedResume: Resume | null
  loading: boolean
  saving: boolean
  error: string | null
  statusMessage: string | null
}

export function useResumes(userId?: string | null) {
  const [state, setState] = useState<ResumesState>({
    resumes: [],
    selectedResume: null,
    loading: true,
    saving: false,
    error: null,
    statusMessage: null,
  })

  // ✅ FIX 1 — use a ref to track selectedResume.id so refresh doesn't recreate on every keystroke
  const selectedResumeIdRef = useRef<string | null | undefined>(null)

  const setSelectedResume = useCallback((resume: Resume | null) => {
    setState((current) => ({
      ...current,
      selectedResume: resume,
    }))
  }, [])

  const setStatusMessage = useCallback((message: string | null) => {
    setState((current) => ({
      ...current,
      statusMessage: message,
    }))
  }, [])

  const refresh = useCallback(
    async (nextSelectedId?: string | null) => {
      if (!userId) {
        setState((current) => ({
          ...current,
          resumes: [],
          selectedResume: null,
          loading: false,
          error: null,
        }))
        return null
      }

      setState((current) => ({
        ...current,
        loading: true,
        error: null,
      }))

      try {
        const resumes = await getUserResumes(userId)
        let selectedResume: Resume | null = null

        if (resumes.length > 0) {
          // ✅ FIX 2 — use ref instead of state.selectedResume?.id
          const targetResumeId =
            nextSelectedId ??
            selectedResumeIdRef.current ??
            resumes.find((resume) => resume.isDefault)?.id ??
            resumes[0]?.id

          if (targetResumeId) {
            const loadedResume = await getResumeById(userId, targetResumeId)
            selectedResume = loadedResume ? normalizeResume(loadedResume, loadedResume.id) : null
          }
        }

        // ✅ FIX 3 — update the ref when resume is loaded
        selectedResumeIdRef.current = selectedResume?.id ?? null

        setState((current) => ({
          ...current,
          resumes,
          selectedResume,
          loading: false,
          error: null,
        }))

        return selectedResume
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not load your resumes right now."

        setState((current) => ({
          ...current,
          resumes: [],
          selectedResume: null,
          loading: false,
          error: message,
        }))

        return null
      }
    },
    // ✅ FIX 4 — removed state.selectedResume?.id from deps, now uses ref
    [userId]
  )

  const create = useCallback(
    async (input?: ResumeInput) => {
      if (!userId) {
        throw new Error("You need to be signed in to create a resume.")
      }

      setState((current) => ({
        ...current,
        saving: true,
        error: null,
      }))

      try {
        const createdResume = await createResume(userId, {
          ...createEmptyResume(input?.title ?? "New Resume"),
          ...input,
        })

        setState((current) => ({
          ...current,
          saving: false,
          statusMessage: "New resume created.",
        }))

        return createdResume
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not create a new resume right now."

        setState((current) => ({
          ...current,
          saving: false,
          error: message,
        }))

        throw error
      }
    },
    [userId]
  )

  const save = useCallback(
    async (resume: Resume) => {
      if (!userId) {
        throw new Error("You need to be signed in to save a resume.")
      }

      setState((current) => ({
        ...current,
        saving: true,
        error: null,
      }))

      try {
        const savedResume = await saveUserResume(userId, resume)

        // ✅ update ref on save too
        selectedResumeIdRef.current = savedResume.id ?? null

        setState((current) => ({
          ...current,
          saving: false,
          selectedResume: normalizeResume(savedResume, savedResume.id),
          statusMessage: "Resume saved successfully.",
        }))

        return savedResume
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Resume save failed. Please try again."

        setState((current) => ({
          ...current,
          saving: false,
          error: message,
        }))

        throw error
      }
    },
    [userId]
  )

  const duplicate = useCallback(
    async (resumeId: string) => {
      if (!userId) {
        throw new Error("You need to be signed in to duplicate a resume.")
      }

      setState((current) => ({
        ...current,
        saving: true,
        error: null,
      }))

      try {
        const duplicatedResume = await duplicateResume(userId, resumeId)

        setState((current) => ({
          ...current,
          saving: false,
          statusMessage: "Resume duplicated.",
        }))

        return duplicatedResume
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not duplicate that resume."

        setState((current) => ({
          ...current,
          saving: false,
          error: message,
        }))

        throw error
      }
    },
    [userId]
  )

  const remove = useCallback(
    async (resumeId: string) => {
      if (!userId) {
        throw new Error("You need to be signed in to delete a resume.")
      }

      setState((current) => ({
        ...current,
        saving: true,
        error: null,
      }))

      try {
        await deleteResume(userId, resumeId)

        setState((current) => ({
          ...current,
          saving: false,
          statusMessage: "Resume deleted.",
        }))
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not delete that resume."

        setState((current) => ({
          ...current,
          saving: false,
          error: message,
        }))

        throw error
      }
    },
    [userId]
  )

  const setDefault = useCallback(
    async (resumeId: string) => {
      if (!userId) {
        throw new Error("You need to be signed in to update the default resume.")
      }

      setState((current) => ({
        ...current,
        saving: true,
        error: null,
      }))

      try {
        await setDefaultResume(userId, resumeId)

        setState((current) => ({
          ...current,
          saving: false,
          statusMessage: "Default resume updated.",
        }))
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not update the default resume."

        setState((current) => ({
          ...current,
          saving: false,
          error: message,
        }))

        throw error
      }
    },
    [userId]
  )

  return useMemo(
    () => ({
      ...state,
      refresh,
      create,
      save,
      duplicate,
      remove,
      setDefault,
      setSelectedResume,
      setStatusMessage,
    }),
    // ✅ FIX 5 — spread state individually so typing doesn't invalidate the whole memo
    [
      state.resumes,
      state.selectedResume,
      state.loading,
      state.saving,
      state.error,
      state.statusMessage,
      refresh,
      create,
      save,
      duplicate,
      remove,
      setDefault,
      setSelectedResume,
      setStatusMessage,
    ]
  )
}