"use client"

import { useMemo, useState } from "react"

import { useAuth } from "@/components/providers/AuthProvider"
import { ATSScorePanel } from "@/components/resume/ATSScorePanel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateResume } from "@/lib/firestore/resumeService"
import { analyzeResume } from "@/lib/resume-analysis"
import type { Resume } from "@/types/resume"
import type { ATSAnalysisResult, AiResumeSuggestionResponse } from "@/types/resume-analysis"

type ResumeInsightsPanelProps = {
  resume: Resume
}

export function ResumeInsightsPanel({
  resume,
}: ResumeInsightsPanelProps) {
  const { user } = useAuth()
  const [jobDescription, setJobDescription] = useState("")
  const [targetRole, setTargetRole] = useState(resume.targetRole || "Software Developer")
  const [aiSummary, setAiSummary] = useState("")
  const [aiSuggestions, setAiSuggestions] = useState<AiResumeSuggestionResponse["suggestions"]>([])
  const [aiSource, setAiSource] = useState<AiResumeSuggestionResponse["source"] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const analysis = useMemo<ATSAnalysisResult>(() => {
    if (resume.atsScore && resume.atsKeywords && resume.atsSections) {
      return {
        overallScore: resume.atsScore,
        breakdown: {
          sectionCompleteness: resume.atsSections.find((section) => section.name === "Section Completeness")?.score ?? 0,
          keywordMatch: resume.atsSections.find((section) => section.name === "Keyword Match")?.score ?? 0,
          formattingSafety: resume.atsSections.find((section) => section.name === "Formatting Safety")?.score ?? 0,
          contentStrength: resume.atsSections.find((section) => section.name === "Content Strength")?.score ?? 0,
          quantifiedImpact: resume.atsSections.find((section) => section.name === "Quantified Impact")?.score ?? 0,
          roleRelevance: resume.atsSections.find((section) => section.name === "Role Relevance")?.score ?? 0,
        },
        missingKeywords: resume.atsKeywords.missing,
        matchedKeywords: resume.atsKeywords.found,
        weakBullets: [],
        suggestions: resume.atsSuggestions ?? [],
        keywordCoverage:
          resume.atsKeywords.found.length + resume.atsKeywords.missing.length > 0
            ? Math.round(
                (resume.atsKeywords.found.length /
                  (resume.atsKeywords.found.length + resume.atsKeywords.missing.length)) *
                  100
              )
            : 0,
      }
    }

    return analyzeResume(resume, jobDescription, targetRole)
  }, [resume, jobDescription, targetRole])

  const requestAiSuggestions = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await fetch("/api/resume/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume,
          jobDescription,
          targetRole,
        }),
      })

      const data = (await response.json()) as AiResumeSuggestionResponse & { error?: string }

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate suggestions right now.")
      }

      setAiSummary(data.summary)
      setAiSuggestions(data.suggestions)
      setAiSource(data.source)

      if (user?.uid && resume.id) {
        await updateResume(user.uid, resume.id, {
          atsScore: data.atsScore,
          atsSuggestions: data.suggestions.map((suggestion) => suggestion.detail),
          atsKeywords: data.keywords,
          atsSections: data.sections,
          fileName: resume.fileName ?? `${resume.title}.json`,
        })
      }
    } catch (requestError) {
      console.error(requestError)
      setError(requestError instanceof Error ? requestError.message : "Unable to generate suggestions.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 print:hidden">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>ATS Scoring V2</CardTitle>
          <CardDescription>
            Analyze this resume against a target job description and role using deterministic ATS-style heuristics.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/10 p-4">
            <div className="space-y-2">
              <Label htmlFor="target-role">Target Role</Label>
              <Input
                id="target-role"
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
                placeholder="Software Developer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-description">Target Job Description</Label>
              <Textarea
                id="job-description"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the job description here. You can still run ATS scoring without it."
                className="min-h-[220px]"
              />
            </div>

            <div className="rounded-xl border border-border/70 bg-background/60 p-3 text-xs leading-5 text-muted-foreground">
              ATS scoring still works without a job description. In that case, PlacePrep scores structure, content strength, quantified impact, and role alignment from your resume alone.
            </div>

            <Button onClick={requestAiSuggestions} disabled={loading}>
              {loading ? "Generating..." : "Generate AI Suggestions"}
            </Button>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <ATSScorePanel analysis={analysis} />
        </CardContent>
      </Card>

      {(aiSummary || aiSuggestions.length > 0) && (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>AI Resume Improvement Notes</CardTitle>
            <CardDescription>
              Optional AI-assisted rewrites layered on top of the deterministic ATS scoring.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiSummary && (
              <div className="rounded-xl border border-border/70 bg-muted/10 p-4">
                <p className="font-medium">Summary</p>
                <p className="mt-2 text-sm text-muted-foreground">{aiSummary}</p>
                {aiSource && (
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Source: {aiSource === "ai" ? "AI-assisted" : "Heuristic fallback"}
                  </p>
                )}
              </div>
            )}

            {aiSuggestions.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {aiSuggestions.map((suggestion) => (
                  <div key={suggestion.title} className="rounded-xl border border-border/70 bg-muted/10 p-4">
                    <p className="font-medium">{suggestion.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{suggestion.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
