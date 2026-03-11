"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { analyzeResume } from "@/lib/resume-analysis"
import type { Resume } from "@/types/resume"
import type { AiResumeSuggestionResponse } from "@/types/resume-analysis"

type ResumeInsightsPanelProps = {
  resume: Resume
}

export function ResumeInsightsPanel({
  resume,
}: ResumeInsightsPanelProps) {
  const [jobDescription, setJobDescription] = useState("")
  const [aiSummary, setAiSummary] = useState("")
  const [aiSuggestions, setAiSuggestions] = useState<AiResumeSuggestionResponse["suggestions"]>([])
  const [aiSource, setAiSource] = useState<AiResumeSuggestionResponse["source"] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const analysis = useMemo(() => analyzeResume(resume, jobDescription), [resume, jobDescription])

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
        }),
      })

      const data = (await response.json()) as AiResumeSuggestionResponse & { error?: string }

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate suggestions right now.")
      }

      setAiSummary(data.summary)
      setAiSuggestions(data.suggestions)
      setAiSource(data.source)
    } catch (requestError) {
      console.error(requestError)
      setError(requestError instanceof Error ? requestError.message : "Unable to generate suggestions.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 print:hidden xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>ATS Score</CardTitle>
          <CardDescription>
            Heuristic scoring based on resume completeness, keyword alignment, and ATS-safe structure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-end justify-between gap-4 rounded-2xl bg-slate-50 p-5">
            <div>
              <p className="text-sm text-muted-foreground">Overall score</p>
              <p className="text-4xl font-bold tracking-tight">{analysis.score}/100</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Keyword coverage</p>
              <p className="text-2xl font-semibold">{analysis.keywordCoverage}%</p>
            </div>
          </div>

          <div className="space-y-3">
            {analysis.breakdown.map((item) => (
              <div key={item.label} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-700">{item.score}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.details}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="mb-2 font-medium text-slate-900">Matched keywords</p>
              <p className="text-sm text-muted-foreground">
                {analysis.matchedKeywords.length > 0 ? analysis.matchedKeywords.join(", ") : "No matched keywords yet."}
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="mb-2 font-medium text-slate-900">Missing keywords</p>
              <p className="text-sm text-muted-foreground">
                {analysis.missingKeywords.length > 0 ? analysis.missingKeywords.join(", ") : "No high-priority gaps detected."}
              </p>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <p className="mb-3 font-medium">Priority improvements</p>
            <div className="space-y-3">
              {analysis.suggestions.map((suggestion) => (
                <div key={suggestion.title} className="rounded-lg bg-slate-50 p-3">
                  <p className="font-medium">{suggestion.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{suggestion.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Improvement Suggestions</CardTitle>
          <CardDescription>
            Paste a target job description to get tailored rewrites and keyword advice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the job description here to improve keyword match and content targeting."
            className="min-h-[220px]"
          />

          <Button onClick={requestAiSuggestions} disabled={loading}>
            {loading ? "Generating..." : "Generate AI Suggestions"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {aiSummary && (
            <div className="rounded-xl border p-4">
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
            <div className="space-y-3">
              {aiSuggestions.map((suggestion) => (
                <div key={suggestion.title} className="rounded-xl border p-4">
                  <p className="font-medium">{suggestion.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{suggestion.detail}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
