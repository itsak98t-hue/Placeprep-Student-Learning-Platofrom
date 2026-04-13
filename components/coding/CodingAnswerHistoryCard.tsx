"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserAnswer } from "@/types/answers"

type CodingAnswerHistoryCardProps = {
  answers: UserAnswer[]
  isLoading: boolean
  error: string | null
}

function formatTimestamp(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Recently"
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function getStatusBadgeClassName(status: UserAnswer["status"]) {
  if (status === "solved") {
    return "bg-emerald-600 text-white"
  }

  if (status === "partial") {
    return "bg-amber-500 text-black"
  }

  if (status === "failed") {
    return "bg-rose-600 text-white"
  }

  return "bg-slate-600 text-white"
}

export function CodingAnswerHistoryCard({
  answers,
  isLoading,
  error,
}: CodingAnswerHistoryCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Recent Coding Answers</CardTitle>
        <CardDescription>
          Your latest recorded coding attempts, saved alongside the adaptive recommendation flow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
            Loading saved coding answers...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">
            {error}
          </div>
        ) : answers.length > 0 ? (
          <div className="space-y-3">
            {answers.map((answer) => (
              <div key={answer.id ?? `${answer.question}-${answer.createdAt}`} className="rounded-2xl border bg-muted/15 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{answer.question}</p>
                      {answer.status && (
                        <Badge className={getStatusBadgeClassName(answer.status)}>
                          {answer.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {answer.company} · Score {answer.score ?? answer.rating}% · {formatTimestamp(answer.createdAt)}
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {answer.feedback || answer.answer}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {typeof answer.timeSpentMin === "number" && <p>Time: {answer.timeSpentMin} min</p>}
                    {typeof answer.hintsUsed === "number" && <p>Hints: {answer.hintsUsed}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
            No coding answers saved yet. Log your next attempt and it will appear here.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
