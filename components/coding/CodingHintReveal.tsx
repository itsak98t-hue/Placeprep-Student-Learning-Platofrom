"use client"

type CodingHintRevealProps = {
  hints: string[]
  revealedCount: number
}

export function CodingHintReveal({
  hints,
  revealedCount,
}: CodingHintRevealProps) {
  const visibleHints = hints.slice(0, revealedCount)
  const nextHintNumber = revealedCount < hints.length ? revealedCount + 1 : null

  if (visibleHints.length === 0) {
    return null
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Hints revealed</p>
          {nextHintNumber ? (
            <p className="text-xs text-muted-foreground">
              Next reveal: Hint {nextHintNumber}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">All available hints are visible.</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {revealedCount} of {hints.length} shown
        </p>
      </div>
      <div className="mt-3 space-y-3">
        {visibleHints.map((hint, index) => (
          <div
            key={`${index + 1}-${hint}`}
            className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground transition-all duration-200"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                Hint {index + 1}
              </p>
              <span className="text-[11px] text-muted-foreground">
                Step {index + 1}
              </span>
            </div>
            <p className="mt-2 leading-6 text-foreground/85">{hint}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
