import { ArrowUpRight } from "lucide-react"

import { getCodingDifficultyLabel } from "@/lib/coding-recommendation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { CodingQuestion } from "@/types/coding"

type RecommendedQuestionCardProps = {
  question: CodingQuestion
  reason?: string
}

function formatTopicLabel(topic: string): string {
  return topic
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getDifficultyBadgeClassName(difficulty: number): string {
  if (difficulty === 1) {
    return "bg-green-600 text-white"
  }
  if (difficulty === 2) {
    return "bg-amber-500 text-white"
  }
  return "bg-rose-600 text-white"
}

function getPresentationReason(reason?: string): string {
  const trimmedReason = reason?.trim()

  if (!trimmedReason) {
    return "This question is a strong next step for your current practice level and should help you build momentum without jumping too far ahead."
  }

  const normalizedReason = trimmedReason.endsWith(".") ? trimmedReason : `${trimmedReason}.`
  return normalizedReason.replace(/^This\s+/i, "Based on your recent coding practice, this ")
}

export function RecommendedQuestionCard({
  question,
  reason,
}: RecommendedQuestionCardProps) {
  return (
    <Card className="border-primary/20 bg-primary/[0.03] shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <CardDescription className="text-xs font-medium uppercase tracking-[0.2em] text-primary/80">
              Primary Recommendation
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl">{question.title}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-background/80">
              {question.platform}
            </Badge>
            <Badge variant="outline" className="bg-background/80">
              {formatTopicLabel(question.topic)}
            </Badge>
            <Badge className={getDifficultyBadgeClassName(question.difficulty)}>
              {getCodingDifficultyLabel(question.difficulty)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Subtopic</p>
            <p className="mt-2 text-muted-foreground">{question.subtopic}</p>
          </div>
          <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Pattern</p>
            <p className="mt-2 text-muted-foreground">{question.pattern}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-background/70 p-4">
          <p className="text-sm font-medium">Why this question?</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {getPresentationReason(reason)}
          </p>
        </div>

        <div className="rounded-2xl border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
          PlacePrep tracks your progress here while you solve on {question.platform} in a separate tab, so each new recommendation can adapt to your latest result.
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild>
          <a href={question.external_link} target="_blank" rel="noopener noreferrer">
            Solve on {question.platform}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
