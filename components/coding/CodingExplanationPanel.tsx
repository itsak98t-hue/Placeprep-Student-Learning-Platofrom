"use client"

import { Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { CodingExplainResponse } from "@/types/coding"

type CodingExplanationPanelProps = {
  explanation: CodingExplainResponse | null
  isLoading: boolean
  error: string | null
  questionTitle?: string | null
  onRequest: () => void
}

export function CodingExplanationPanel({
  explanation,
  isLoading,
  error,
  questionTitle,
  onRequest,
}: CodingExplanationPanelProps) {
  return (
    <Card className="border border-border/80 bg-card shadow-sm">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI Explanation
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                {explanation ? "Why this felt tricky" : "Want help understanding where you got stuck?"}
              </h3>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {questionTitle
                  ? `Get a short explanation for ${questionTitle} and a few focused next steps.`
                  : "Get a short explanation and a few focused next steps."}
              </p>
              <p className="text-xs text-muted-foreground">
                This is guidance to help you re-approach the problem, not a full editorial or code solution.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onRequest} disabled={isLoading} className="shrink-0 border-border/70 bg-background/60 hover:bg-background">
            {isLoading ? "Generating..." : explanation ? "Refresh AI Explanation" : "Get AI Explanation"}
          </Button>
        </div>

        {!explanation && !isLoading && !error && (
          <div className="rounded-2xl border border-border/70 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
            A short explanation can help you spot the concept gap before you retry the question.
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-border/70 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
            Generating your explanation...
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {explanation && !isLoading && !error && (
          <div className="space-y-5 rounded-2xl border border-border/70 bg-gradient-to-br from-background to-muted/[0.12] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="space-y-2.5">
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Why this felt tricky</p>
                <p className="text-sm leading-7 text-foreground/90">{explanation.explanation}</p>
              </div>
            </div>

            {explanation.focus_areas.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Focus next on</p>
                <div className="flex flex-wrap gap-2">
                  {explanation.focus_areas.map((focusArea) => (
                    <Badge
                      key={focusArea}
                      variant="outline"
                      className="rounded-full border-primary/15 bg-primary/[0.06] px-3 py-1 text-foreground/85"
                    >
                      {focusArea}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
