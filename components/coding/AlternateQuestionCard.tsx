import { ArrowUpRight } from "lucide-react"

import { getCodingDifficultyLabel } from "@/lib/coding-recommendation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { CodingQuestion } from "@/types/coding"

type AlternateQuestionCardProps = {
  title: string
  description: string
  question: CodingQuestion | null
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

export function AlternateQuestionCard({
  title,
  description,
  question,
}: AlternateQuestionCardProps) {
  return (
    <Card className="border bg-muted/[0.02] shadow-sm">
      <CardHeader className="space-y-2">
        <CardDescription className="text-xs font-medium uppercase tracking-[0.18em]">
          {description}
        </CardDescription>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {question ? (
          <>
            <div className="space-y-2">
              <p className="font-medium">{question.title}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{question.platform}</Badge>
                <Badge variant="outline">{formatTopicLabel(question.topic)}</Badge>
                <Badge className={getDifficultyBadgeClassName(question.difficulty)}>
                  {getCodingDifficultyLabel(question.difficulty)}
                </Badge>
              </div>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Subtopic:</span> {question.subtopic}</p>
              <p className="mt-2"><span className="font-medium text-foreground">Pattern:</span> {question.pattern}</p>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
            No alternate question is available right now. Try recording one more attempt to improve the recommendation path.
          </div>
        )}
      </CardContent>
      {question && (
        <CardFooter>
          <Button asChild variant="outline">
            <a href={question.external_link} target="_blank" rel="noopener noreferrer">
              Open on {question.platform}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
