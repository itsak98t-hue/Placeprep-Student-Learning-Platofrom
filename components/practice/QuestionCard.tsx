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
  recommended?: boolean
  onUpdateAttempt?: () => void
  onSolvedToggle: () => void
  onAttemptedToggle: () => void
  onBookmarkedToggle: () => void
}

export function QuestionCard({
  question,
  solved,
  attempted,
  bookmarked,
  recommended = false,
  onUpdateAttempt,
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
            {recommended && (
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                Recommended
              </Badge>
            )}
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
        <Button asChild className="min-w-[130px]">
          <Link href={`/practice/${question.id}`}>Solve Question</Link>
        </Button>

        {onUpdateAttempt ? (
          <Button variant="outline" onClick={onUpdateAttempt} className="min-w-[130px]">
            Update Attempt
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onSolvedToggle} className="min-w-[130px]">
              {solved ? "Unmark Solved" : "Mark Solved"}
            </Button>
            <Button variant="outline" onClick={onAttemptedToggle} className="min-w-[140px]">
              {attempted ? "Unmark Attempted" : "Mark Attempted"}
            </Button>
          </>
        )}

        <Button variant="outline" onClick={onBookmarkedToggle} className="min-w-[110px]">
          {bookmarked ? "Remove Bookmark" : "Bookmark"}
        </Button>
      </CardFooter>
    </Card>
  )
}
