"use client"

import type { BehavioralEvaluationResponse } from "@/types/behavioral-evaluation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

type BehavioralFeedbackCardProps = {
  result: BehavioralEvaluationResponse
  compact?: boolean
}

type EvaluationLabel = BehavioralEvaluationResponse["label"]

function getLabelBadgeClassName(label: EvaluationLabel) {
  if (label === "strong") {
    return "border-transparent bg-emerald-600 text-white shadow-sm shadow-emerald-950/20"
  }

  if (label === "average") {
    return "border-transparent bg-amber-500 text-black shadow-sm shadow-amber-950/20"
  }

  return "border-transparent bg-rose-600 text-white shadow-sm shadow-rose-950/20"
}

function getScoreCardClassName(value: number) {
  if (value >= 8) {
    return "border-emerald-500/20 bg-emerald-500/5"
  }

  if (value >= 5) {
    return "border-amber-500/20 bg-amber-500/5"
  }

  return "border-rose-500/20 bg-rose-500/5"
}

function getProgressClassName(value: number) {
  if (value >= 8) {
    return "[&>div]:bg-emerald-500"
  }

  if (value >= 5) {
    return "[&>div]:bg-amber-500"
  }

  return "[&>div]:bg-rose-500"
}

function ScoreSection({
  label,
  value,
  description,
}: {
  label: string
  value: number
  description: string
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${getScoreCardClassName(value)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="rounded-full border bg-background/70 px-2.5 py-1 text-xs text-muted-foreground">
          / 10
        </div>
      </div>
      <Progress
        value={Math.max(0, Math.min(100, value * 10))}
        className={`mt-4 h-2.5 bg-muted/60 ${getProgressClassName(value)}`}
      />
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}

export function BehavioralFeedbackCard({
  result,
  compact = false,
}: BehavioralFeedbackCardProps) {
  const hasFeedback = result.feedback.trim().length > 0
  const isInvalidAnswer = result.is_invalid_answer === true
  const validationMessage = result.validation_message?.trim() || result.feedback.trim()

  return (
    <Card className="overflow-hidden border bg-card/95 shadow-sm">
      <CardHeader className={compact ? "space-y-3 border-b bg-muted/10 pb-4" : "space-y-3 border-b bg-muted/10"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg">AI Feedback</CardTitle>
            <CardDescription className="mt-1">
              Behavioral answer evaluation based on clarity, structure, and impact.
            </CardDescription>
          </div>
          <Badge className={`px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getLabelBadgeClassName(result.label)}`}>
            {result.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-5 sm:p-6">
        {isInvalidAnswer && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">Answer Warning</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {validationMessage || "Answer is not meaningful. Please provide a clear response."}
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <ScoreSection
            label="Clarity"
            value={result.score_clarity}
            description="How easy your answer is to follow and understand."
          />
          <ScoreSection
            label="Structure"
            value={result.score_structure}
            description="How clearly your response shows situation, action, and result."
          />
          <ScoreSection
            label="Impact"
            value={result.score_impact}
            description="How strongly your answer communicates outcomes and importance."
          />
        </div>

        <div className={`grid gap-4 ${hasFeedback ? "lg:grid-cols-[0.9fr_1.1fr]" : ""}`}>
          <div className="rounded-2xl border bg-muted/10 p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">What&apos;s Missing</h3>
            {result.missing.length > 0 ? (
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                {result.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                No major missing points were detected.
              </p>
            )}
          </div>

          {hasFeedback && (
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">Feedback</h3>
              <p className="mt-4 text-sm leading-7 text-foreground/90">{result.feedback}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
