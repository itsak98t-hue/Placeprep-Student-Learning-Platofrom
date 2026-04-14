"use client"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"

import { ResumeInsightsPanel } from "@/components/resume/ResumeInsightsPanel"
import { ResumePreviewRenderer } from "@/components/resume/ResumePreviewRenderer"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/firebase"
import {
  DEFAULT_RESUME_TEMPLATE_ID,
  isResumeTemplateId,
  resumeTemplates,
  type ResumeTemplateId,
} from "@/lib/resume-templates"
import { emptyResume, normalizeResume, resumeHasContent } from "@/lib/resume"
import type { Resume } from "@/types/resume"

function ResumePreviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const [resume, setResume] = useState<Resume>(emptyResume)
  const [hasResumes, setHasResumes] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [templateId, setTemplateId] = useState<ResumeTemplateId>(DEFAULT_RESUME_TEMPLATE_ID)

  useEffect(() => {
    const requestedTemplate = searchParams.get("template") || DEFAULT_RESUME_TEMPLATE_ID
    setTemplateId(isResumeTemplateId(requestedTemplate) ? requestedTemplate : DEFAULT_RESUME_TEMPLATE_ID)
  }, [searchParams])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError("")

    const resumesRef = collection(db, "users", user.uid, "resumes")
    const resumesQuery = query(resumesRef, orderBy("updatedAtMs", "desc"))
    const unsubscribe = onSnapshot(
      resumesQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setHasResumes(false)
          setResume(emptyResume)
          setLoading(false)
          return
        }

        setHasResumes(true)
        const resumeIdParam = searchParams.get("resumeId")
        let selectedDoc = resumeIdParam
          ? snapshot.docs.find((doc) => doc.id === resumeIdParam)
          : snapshot.docs[0]

        if (!selectedDoc) {
          selectedDoc = snapshot.docs[0]
        }

        const nextResume = normalizeResume(
          { ...(selectedDoc.data() as Resume), id: selectedDoc.id } as Resume,
          selectedDoc.id
        )
        setResume(nextResume)
        setLoading(false)

        const params = new URLSearchParams(searchParams.toString())
        let shouldReplace = false

        if (!resumeIdParam || resumeIdParam !== selectedDoc.id) {
          params.set("resumeId", selectedDoc.id)
          shouldReplace = true
        }

        if (!params.get("template")) {
          const nextTemplate = (selectedDoc.data() as Resume | undefined)?.template
          if (nextTemplate && isResumeTemplateId(nextTemplate)) {
            params.set("template", nextTemplate)
          } else {
            params.set("template", DEFAULT_RESUME_TEMPLATE_ID)
          }
          shouldReplace = true
        }

        if (shouldReplace) {
          router.replace(`/dashboard/resume/preview?${params.toString()}`)
        }
      },
      (error) => {
        console.error("Resume preview load error:", error)
        setLoadError("We couldn't load your saved resume preview right now.")
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [authLoading, router, searchParams, user?.uid])

  if (loading || authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Generating ATS-friendly preview...</p>
      </div>
    )
  }

  const hasContent = resumeHasContent(resume)
  const resumeId = searchParams.get("resumeId")

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
        <div className="flex flex-col gap-4 rounded-3xl border bg-background p-6 shadow-sm print:hidden md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">ATS Resume Preview</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              This preview uses a clean, single-column template designed to stay professional on screen
              and printable on A4 paper.
            </p>
            {loadError && <p className="text-sm text-destructive">{loadError}</p>}
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={templateId}
              onChange={(event) => {
                const nextTemplateId = isResumeTemplateId(event.target.value)
                  ? event.target.value
                  : DEFAULT_RESUME_TEMPLATE_ID
                setTemplateId(nextTemplateId)

                const params = new URLSearchParams(searchParams.toString())
                params.set("template", nextTemplateId)
                router.replace(`/dashboard/resume/preview?${params.toString()}`)
              }}
            >
              {resumeTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <Button asChild variant="outline">
              <Link href={resumeId ? `/dashboard/resume?resumeId=${resumeId}` : "/dashboard/resume"}>Back to Edit</Link>
            </Button>
            <Button onClick={() => window.print()} disabled={!hasContent}>
              Print / Download PDF
            </Button>
          </div>
        </div>

        {!hasResumes ? (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>No Resume Data Yet</CardTitle>
              <CardDescription>
                Save your resume details first, then come back here to generate the ATS preview.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard/resume">Back to Edit</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <ResumeInsightsPanel resume={resume} />
            <ResumePreviewRenderer resume={resume} templateId={templateId} />
          </>
        )}
      </div>
    </div>
  )
}

export default function ResumePreviewPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">Loading ATS-friendly preview...</div>}>
      <ResumePreviewContent />
    </Suspense>
  )
}
