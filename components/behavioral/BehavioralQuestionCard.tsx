"use client"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { BehavioralQuestion } from "@/data/types"

type BehavioralQuestionCardProps = {
  question: BehavioralQuestion
  prepared: boolean
  bookmarked: boolean
  onPreparedToggle: () => void
  onBookmarkedToggle: () => void
}

export function BehavioralQuestionCard({
  question,
  prepared,
  bookmarked,
  onPreparedToggle,
  onBookmarkedToggle,
}: BehavioralQuestionCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xl leading-snug">{question.title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            {prepared && <Badge className="bg-emerald-600 text-white">Prepared</Badge>}
            {bookmarked && <Badge className="bg-sky-600 text-white">Bookmarked</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{question.category}</Badge>
          <Badge variant="outline">{question.round}</Badge>
          <Badge variant="outline">Frequency: {question.frequency}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-foreground/90">{question.question}</p>
        <p className="text-sm leading-6 text-muted-foreground">{question.whyItMatters}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{question.sourceLabel}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/practice/${question.id}`}>Open Prep</Link>
        </Button>
        <Button variant="outline" onClick={onPreparedToggle}>
          {prepared ? "Unmark Prepared" : "Mark Prepared"}
        </Button>
        <Button variant="outline" onClick={onBookmarkedToggle}>
          {bookmarked ? "Remove Bookmark" : "Bookmark"}
        </Button>
      </CardFooter>
    </Card>
  )
}
