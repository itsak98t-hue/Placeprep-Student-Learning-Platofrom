"use client"

import { Badge } from "@/components/ui/badge"
import type { PracticeQuestion } from "@/data/types"

type QuestionMetaBadgesProps = {
  question: PracticeQuestion
}

export function QuestionMetaBadges({ question }: QuestionMetaBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">{question.topic}</Badge>
      <Badge variant="outline">{question.difficulty}</Badge>
      <Badge variant="outline">{question.round}</Badge>
      <Badge variant="outline">Frequency: {question.frequency}</Badge>
    </div>
  )
}
