import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { CourseConfig } from "@/types/learning"

type CourseCardProps = {
  course: CourseConfig
  breakdown?: {
    avgScore: number
    accuracy: number
    topicsCovered: number
    status: string
  }
}

function getStatusTone(status: string) {
  switch (status) {
    case "completed":
      return "bg-cyan-500/10 text-cyan-200 border-cyan-500/30"
    case "improving":
      return "bg-emerald-500/10 text-emerald-200 border-emerald-500/30"
    case "in-progress":
      return "bg-amber-500/10 text-amber-200 border-amber-500/30"
    default:
      return "bg-muted/30 text-muted-foreground border-border/70"
  }
}

export function CourseCard({ course, breakdown }: CourseCardProps) {
  const completion = breakdown
    ? Math.min(100, Math.round((breakdown.topicsCovered / course.totalTopics) * 100))
    : 0

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{course.label}</CardTitle>
            <CardDescription>
              {breakdown
                ? `${breakdown.topicsCovered}/${course.totalTopics} topics covered`
                : "Not started yet"}
            </CardDescription>
          </div>
          <Badge variant="outline" className={getStatusTone(breakdown?.status ?? "not-started")}>
            {breakdown?.status?.replace("-", " ") ?? "not started"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {breakdown ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border bg-muted/10 p-3">
                <p className="text-muted-foreground">Avg Score</p>
                <p className="mt-1 text-lg font-semibold">{breakdown.avgScore}%</p>
              </div>
              <div className="rounded-xl border bg-muted/10 p-3">
                <p className="text-muted-foreground">Accuracy</p>
                <p className="mt-1 text-lg font-semibold">{breakdown.accuracy}%</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Completion</span>
                <span>{completion}%</span>
              </div>
              <Progress value={completion} className="h-2 transition-all duration-700" />
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-4 text-sm text-muted-foreground">
            Start practicing this course to see your live breakdown here.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

