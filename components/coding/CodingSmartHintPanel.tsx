"use client"

import { Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type CodingSmartHintPanelProps = {
  canRequestHint: boolean
  hint: string | null
  isLoading: boolean
  error: string | null
  onRequest: () => void
}

export function CodingSmartHintPanel({
  canRequestHint,
  hint,
  isLoading,
  error,
  onRequest,
}: CodingSmartHintPanelProps) {
  if (!canRequestHint && !hint && !isLoading && !error) {
    return null
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-background to-muted/[0.14] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2">
            <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
              <Sparkles className="mr-1 h-3 w-3" />
              AI Hint
            </Badge>
            <p className="text-sm font-medium text-foreground">Smart Hint</p>
          </div>
          <p className="text-xs text-muted-foreground">
            A small coaching nudge, not a full solution or code reveal.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRequest} disabled={isLoading} className="shrink-0 border-border/70 bg-background/60 hover:bg-background">
          {isLoading ? "Generating..." : hint ? "Refresh AI Hint" : "Need Smarter Hint"}
        </Button>
      </div>

      {!hint && !isLoading && !error && (
        <div className="mt-3 rounded-xl border border-border/70 bg-background/50 px-3 py-3 text-sm text-muted-foreground">
          Use this after the built-in hints if you want one more idea about what to notice next.
        </div>
      )}

      {isLoading && (
        <div className="mt-3 rounded-xl border border-border/70 bg-background/50 px-3 py-3 text-sm text-muted-foreground">
          Generating a smarter hint...
        </div>
      )}

      {error && !isLoading && (
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {hint && !isLoading && !error && (
        <div className="mt-3 rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary/80">
            Guided direction
          </p>
          <p className="mt-2 text-sm leading-7 text-foreground/90">{hint}</p>
        </div>
      )}
    </div>
  )
}
