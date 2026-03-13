"use client"

import Link from "next/link"

import { QuestionMetaBadges } from "@/components/practice/QuestionMetaBadges"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { PracticeQuestion } from "@/data/types"

type QuestionCardProps = {
  question: PracticeQuestion
  solved: boolean
  attempted: boolean
  bookmarked: boolean
  onSolvedToggle: () => void
  onAttemptedToggle: () => void
  onBookmarkedToggle: () => void
}

export function QuestionCard({
  question,
  solved,
  attempted,
  bookmarked,
  onSolvedToggle,
  onAttemptedToggle,
  onBookmarkedToggle,
}: QuestionCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xl">{question.title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            {solved && <Badge className="bg-green-600 text-white">Solved</Badge>}
            {attempted && <Badge className="bg-amber-500 text-white">Attempted</Badge>}
            {bookmarked && <Badge className="bg-blue-600 text-white">Bookmarked</Badge>}
          </div>
        </div>
        <QuestionMetaBadges question={question} />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">{question.shortDescription}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{question.sourceLabel}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/practice/${question.id}`}>Solve Question</Link>
        </Button>
        <Button variant="outline" onClick={onSolvedToggle}>
          {solved ? "Unmark Solved" : "Mark Solved"}
        </Button>
        <Button variant="outline" onClick={onAttemptedToggle}>
          {attempted ? "Unmark Attempted" : "Mark Attempted"}
        </Button>
        <Button variant="outline" onClick={onBookmarkedToggle}>
          {bookmarked ? "Remove Bookmark" : "Bookmark"}
        </Button>
      </CardFooter>
    </Card>
  )
}
