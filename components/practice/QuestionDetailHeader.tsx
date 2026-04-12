"use client"

import { QuestionMetaBadges } from "@/components/practice/QuestionMetaBadges"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PracticeQuestion } from "@/data/types"

type QuestionDetailHeaderProps = {
  question: PracticeQuestion
  solved: boolean
  attempted: boolean
  bookmarked: boolean
  onSolvedToggle: () => void
  onAttemptedToggle: () => void
  onBookmarkedToggle: () => void
}

export function QuestionDetailHeader({
  question,
  solved,
  attempted,
  bookmarked,
  onSolvedToggle,
  onAttemptedToggle,
  onBookmarkedToggle,
}: QuestionDetailHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="tier-1 capitalize">{question.company}</Badge>
            {solved && <Badge className="bg-green-600 text-white">Solved</Badge>}
            {attempted && <Badge className="bg-amber-500 text-white">Attempted</Badge>}
            {bookmarked && <Badge className="bg-blue-600 text-white">Bookmarked</Badge>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{question.title}</h1>
          <p className="text-sm text-muted-foreground">{question.sourceLabel}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={onSolvedToggle}>
            {solved ? "Unmark Solved" : "Mark as Solved"}
          </Button>
          <Button variant="outline" onClick={onAttemptedToggle}>
            {attempted ? "Unmark Attempted" : "Mark as Attempted"}
          </Button>
          <Button variant="outline" onClick={onBookmarkedToggle}>
            {bookmarked ? "Remove Bookmark" : "Bookmark"}
          </Button>
        </div>
      </div>

      <QuestionMetaBadges question={question} />
    </div>
  )
}
