"use client"

import type { AIFeedback } from "@/types/answers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type AIFeedbackCardProps = {
  score: number
  feedback: AIFeedback
}

function FeedbackList({
  title,
  items,
}: {
  title: string
  items: string[]
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <ul className="space-y-1 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  )
}

export function AIFeedbackCard({ score, feedback }: AIFeedbackCardProps) {
  const normalizedScore = score <= 10 ? score * 10 : score

  return (
    <Card className="border border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="space-y-2 border-b bg-muted/10">
        <CardTitle className="text-lg">AI Feedback</CardTitle>
        <p className="text-sm text-muted-foreground">
          Score: <span className="font-medium text-foreground">{normalizedScore}%</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <FeedbackList title="Strengths" items={feedback.strengths} />
        <FeedbackList title="Improvements" items={feedback.improvements} />
        <FeedbackList title="Suggestions" items={feedback.suggestions} />
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Explanation</p>
          <p className="text-sm leading-7 text-foreground/90">{feedback.ratingExplanation}</p>
        </div>
      </CardContent>
    </Card>
  )
}
