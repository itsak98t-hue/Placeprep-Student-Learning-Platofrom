"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, FilePlus2, Loader2, Sparkles } from "lucide-react"

import { CreateResumeDialog } from "@/components/resume/CreateResumeDialog"
import { DeleteResumeDialog } from "@/components/resume/DeleteResumeDialog"
import { ResumeCard } from "@/components/resume/ResumeCard"
import { ResumeEditor } from "@/components/resume/ResumeEditor"
import { ResumeInsightsPanel } from "@/components/resume/ResumeInsightsPanel"
import { useAuth } from "@/components/providers/AuthProvider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useResumes } from "@/hooks/useResumes"
import type { ResumeInput, ResumeListItem } from "@/types/resume"

const RESUME_FIRESTORE_DEBUG = process.env.NEXT_PUBLIC_FIRESTORE_DEBUG_RESUMES === "true"

export function ResumeManager() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const {
    resumes,
    selectedResume,
    loading,
    saving,
    error,
    statusMessage,
    refresh,
    create,
    save,
    duplicate,
    remove,
    setDefault,
    setSelectedResume,
    setStatusMessage,
  } = useResumes(user?.uid)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [resumeToDelete, setResumeToDelete] = useState<ResumeListItem | null>(null)
  const [localResume, setLocalResume] = useState(selectedResume)

  useEffect(() => {
    setLocalResume(selectedResume)
  }, [selectedResume?.id])

  const selectedResumeId = useMemo(
    () => selectedResume?.id ?? searchParams.get("resumeId"),
    [searchParams, selectedResume?.id]
  )

  const syncSelectedResume = useCallback((resumeId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (resumeId) {
      params.set("resumeId", resumeId)
    } else {
      params.delete("resumeId")
    }
    const queryString = params.toString()
    router.replace(queryString ? `/dashboard/resume?${queryString}` : "/dashboard/resume")
  }, [searchParams, router])

  const refreshResumes = useCallback(async (nextSelectedId?: string | null) => {
    const loadedResume = await refresh(nextSelectedId ?? searchParams.get("resumeId"))
    syncSelectedResume(loadedResume?.id ?? null)
  }, [refresh, searchParams, syncSelectedResume])

  useEffect(() => {
    if (authLoading) return
    if (RESUME_FIRESTORE_DEBUG) console.log("UID:", user?.uid)
    if (!user?.uid) {
      void refresh(null)
      return
    }
    void refreshResumes(searchParams.get("resumeId"))
  }, [authLoading, user?.uid])

  useEffect(() => {
    if (!statusMessage) return
    toast({ title: "Resume manager", description: statusMessage })
    setStatusMessage(null)
  }, [setStatusMessage, statusMessage, toast])

  const handleCreateResume = useCallback(async (values: ResumeInput) => {
    try {
      const createdResume = await create({
        ...values,
        isDefault: resumes.length === 0,
      })
      setCreateDialogOpen(false)
      await refreshResumes(createdResume.id)
    } catch (error) {
      console.error(error)
    }
  }, [create, resumes.length, refreshResumes])

  const handleEditResume = useCallback(async (resume: ResumeListItem) => {
    await refreshResumes(resume.id ?? null)
  }, [refreshResumes])

  const handleDuplicateResume = useCallback(async (resumeId: string) => {
    try {
      const duplicatedResume = await duplicate(resumeId)
      await refreshResumes(duplicatedResume?.id ?? null)
    } catch (error) {
      console.error(error)
    }
  }, [duplicate, refreshResumes])

  const handleDeleteResume = useCallback(async () => {
    if (!resumeToDelete?.id) return
    try {
      const wasSelected = selectedResume?.id === resumeToDelete.id
      const fallbackId = wasSelected ? null : selectedResume?.id ?? null
      await remove(resumeToDelete.id)
      setResumeToDelete(null)
      await refreshResumes(fallbackId)
    } catch (error) {
      console.error(error)
    }
  }, [resumeToDelete, selectedResume?.id, remove, refreshResumes])

  const handleSetDefault = useCallback(async (resumeId: string) => {
    try {
      await setDefault(resumeId)
      await refreshResumes(resumeId)
    } catch (error) {
      console.error(error)
    }
  }, [setDefault, refreshResumes])

  const handleSaveResume = useCallback(async (resumeToSave: typeof selectedResume) => {
    if (!resumeToSave) return
    try {
      const savedResume = await save(resumeToSave)
      await refreshResumes(savedResume.id ?? resumeToSave.id ?? null)
    } catch (error) {
      console.error(error)
    }
  }, [save, refreshResumes])

  const handleOpenPreview = useCallback(() => {
    if (!localResume?.id) return
    router.push(
      `/dashboard/resume/preview?resumeId=${localResume.id}&template=${encodeURIComponent(localResume.template)}`
    )
  }, [localResume?.id, localResume?.template, router])

  if (loading || authLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-[132px] w-full rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-[220px] w-full rounded-3xl" />
          <Skeleton className="h-[220px] w-full rounded-3xl" />
          <Skeleton className="h-[220px] w-full rounded-3xl" />
        </div>
        <Skeleton className="h-[720px] w-full rounded-3xl" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Sign in to manage resumes</CardTitle>
            <CardDescription>
              Your saved resume versions are tied to your account, so sign in to create, edit, and organize them.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <>
      <CreateResumeDialog
        open={createDialogOpen}
        isSubmitting={saving}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreateResume}
      />
      <DeleteResumeDialog
        open={Boolean(resumeToDelete)}
        resume={resumeToDelete}
        onOpenChange={(open) => !open && setResumeToDelete(null)}
        onConfirm={handleDeleteResume}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Resume Manager
            </div>
            <h1 className="text-3xl font-bold tracking-tight">My resumes</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Keep multiple resume versions for different companies and roles, then jump into the editor whenever one needs a refresh.
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}
            Create New Resume
          </Button>
        </div>

        {error && (
          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>We could not load your resumes</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void refreshResumes(selectedResumeId)}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Saved Resumes</CardTitle>
              <CardDescription>
                Edit a draft, duplicate it for another company, or set one version as your default.
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {resumes.length} saved {resumes.length === 1 ? "resume" : "resumes"}
            </div>
          </CardHeader>
          <CardContent>
            {resumes.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {resumes.map((resume) => (
                  <ResumeCard
                    key={resume.id}
                    resume={resume}
                    selected={resume.id === selectedResume?.id}
                    onEdit={() => void handleEditResume(resume)}
                    onDuplicate={() => void handleDuplicateResume(resume.id!)}
                    onDelete={() => setResumeToDelete(resume)}
                    onSetDefault={() => void handleSetDefault(resume.id!)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border/70 bg-muted/[0.08] px-6 py-12 text-center">
                <div className="mx-auto max-w-md space-y-3">
                  <h3 className="text-lg font-semibold">No resumes yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Create your first resume to start organizing tailored versions for different opportunities.
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)} disabled={saving}>
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Create First Resume
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {localResume ? (
            <>
              <ResumeEditor
                resume={localResume}
                isSaving={saving}
                statusMessage={statusMessage ?? undefined}
                onChange={setLocalResume}
                onSave={handleSaveResume}
                onPreview={handleOpenPreview}
              />
              <ResumeInsightsPanel resume={localResume} />
            </>
          ) : (
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>Select a resume to edit</CardTitle>
                <CardDescription>
                  Pick a saved resume above, or create a new one to open the builder.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setCreateDialogOpen(true)} disabled={saving}>
                  Create New Resume
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}