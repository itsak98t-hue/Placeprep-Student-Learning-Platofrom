"use client"

import { ProgressStat } from "@/components/practice/ProgressStat"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BehavioralCategory } from "@/data/types"

type BehavioralProgressSummaryProps = {
  title: string
  prepared: number
  bookmarked: number
  total: number
  categoryCounts: Map<BehavioralCategory, number>
}

export function BehavioralProgressSummary({
  title,
  prepared,
  bookmarked,
  total,
  categoryCounts,
}: BehavioralProgressSummaryProps) {
  const preparedCategories = [...categoryCounts.entries()].filter(([, count]) => count > 0)

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <ProgressStat label="Prepared" value={`${prepared}/${total}`} />
          <ProgressStat label="Bookmarked" value={`${bookmarked}/${total}`} />
          <ProgressStat label="Remaining" value={`${Math.max(total - prepared, 0)}/${total}`} />
        </div>

        <div className="rounded-2xl border bg-muted/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Category Progress</p>
          {preparedCategories.length > 0 ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {preparedCategories.map(([category, count]) => (
                <div key={category} className="rounded-xl border bg-background/70 px-4 py-3">
                  <p className="text-sm font-medium">{category}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{count} prepared</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Start marking questions as prepared to track category-wise readiness.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
