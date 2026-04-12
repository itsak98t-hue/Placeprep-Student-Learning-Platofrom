"use client"

import { AlertCircle, CheckCircle2, FileSearch, Sparkles } from "lucide-react"

import { ATSBreakdown } from "@/components/resume/ATSBreakdown"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ATSAnalysisResult } from "@/types/resume-analysis"

type ATSScorePanelProps = {
  analysis: ATSAnalysisResult
}

export function ATSScorePanel({ analysis }: ATSScorePanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>ATS Score</CardTitle>
          <CardDescription>
            Deterministic scoring across structure, keyword match, content quality, impact, and role fit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Overall score</p>
                <p className="text-4xl font-bold tracking-tight">{analysis.overallScore}/100</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Keyword coverage</p>
                <p className="text-2xl font-semibold">{analysis.keywordCoverage}%</p>
              </div>
            </div>
          </div>

          <ATSBreakdown breakdown={analysis.breakdown} />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSearch className="h-4 w-4 text-primary" />
              Keyword Gaps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Missing keywords</p>
              <div className="flex flex-wrap gap-2">
                {analysis.missingKeywords.length > 0 ? (
                  analysis.missingKeywords.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200">
                      {keyword}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No high-priority keyword gaps detected.</p>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Matched keywords</p>
              <div className="flex flex-wrap gap-2">
                {analysis.matchedKeywords.length > 0 ? (
                  analysis.matchedKeywords.slice(0, 12).map((keyword) => (
                    <Badge key={keyword} variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                      {keyword}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Add a job description to unlock role-specific keyword matching.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-4 w-4 text-primary" />
              Weak Content Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.weakBullets.length > 0 ? (
                analysis.weakBullets.map((bullet) => (
                  <div key={bullet} className="rounded-xl border border-border/70 bg-muted/10 p-3 text-sm text-muted-foreground">
                    {bullet}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-border/70 bg-muted/10 p-3 text-sm text-muted-foreground">
                  No weak bullets flagged. Your project and experience statements are reasonably specific.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              Actionable Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.suggestions.map((suggestion) => (
              <div key={suggestion} className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/10 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">{suggestion}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
