"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type QuestionProgressSummaryProps = {
  title: string
  solved: number
  attempted: number
  bookmarked: number
  total: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
}

export function QuestionProgressSummary({
  title,
  solved,
  attempted,
  bookmarked,
  total,
  easySolved,
  mediumSolved,
  hardSolved,
}: QuestionProgressSummaryProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <ProgressStat label="Solved" value={`${solved}/${total}`} />
        <ProgressStat label="Attempted" value={`${attempted}/${total}`} />
        <ProgressStat label="Bookmarked" value={`${bookmarked}`} />
        <ProgressStat label="Easy Solved" value={`${easySolved}`} />
        <ProgressStat label="Medium Solved" value={`${mediumSolved}`} />
        <ProgressStat label="Hard Solved" value={`${hardSolved}`} />
      </CardContent>
    </Card>
  )
}

function ProgressStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  )
}
