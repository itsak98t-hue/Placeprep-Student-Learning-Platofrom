"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"

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

export default function ResumePreviewPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [resume, setResume] = useState<Resume>(emptyResume)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [templateId, setTemplateId] = useState<ResumeTemplateId>(DEFAULT_RESUME_TEMPLATE_ID)

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      setLoading(false)
      return
    }

    const loadResume = async () => {
      try {
        const ref = doc(db, "resumes", user.uid)
        const snap = await getDoc(ref)

        if (snap.exists()) {
          setResume(normalizeResume(snap.data().resume))
        } else {
          setResume(emptyResume)
        }
      } catch (error) {
        console.error("Resume preview load error:", error)
        setLoadError("We couldn't load your saved resume preview right now.")
      } finally {
        setLoading(false)
      }
    }

    void loadResume()
  }, [authLoading, user])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const requestedTemplate = params.get("template") || DEFAULT_RESUME_TEMPLATE_ID
    setTemplateId(isResumeTemplateId(requestedTemplate) ? requestedTemplate : DEFAULT_RESUME_TEMPLATE_ID)
  }, [])

  if (loading || authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Generating ATS-friendly preview...</p>
      </div>
    )
  }

  const hasContent = resumeHasContent(resume)

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

                const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
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
              <Link href="/dashboard/resume">Back to Edit</Link>
            </Button>
            <Button onClick={() => window.print()} disabled={!hasContent}>
              Print / Download PDF
            </Button>
          </div>
        </div>

        {!hasContent ? (
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
