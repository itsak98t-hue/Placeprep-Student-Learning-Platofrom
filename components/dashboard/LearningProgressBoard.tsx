"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { LearningModuleProgress } from "@/types/progress"

type LearningProgressBoardProps = {
  modules: LearningModuleProgress[]
}

function getStatusBadgeClassName(status: LearningModuleProgress["status"]) {
  switch (status) {
    case "Completed":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
    case "Strong":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
    case "Improving":
      return "border-blue-500/30 bg-blue-500/10 text-blue-200"
    case "Needs Work":
      return "border-rose-500/30 bg-rose-500/10 text-rose-200"
    case "In Progress":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200"
    case "Not Started":
    default:
      return "border-border/70 bg-muted/20 text-muted-foreground"
  }
}

export function LearningProgressBoard({ modules }: LearningProgressBoardProps) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Learning Progress Board</CardTitle>
        <CardDescription>Completion and performance across core placement prep modules.</CardDescription>
      </CardHeader>
      <CardContent>
        {modules.length > 0 ? (
          <div className="space-y-4">
            {modules.map((module) => (
              <div key={module.moduleId} className="rounded-2xl border border-border/70 bg-muted/10 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{module.moduleName}</p>
                    <p className="text-sm text-muted-foreground">
                      {module.completedTopics}/{module.totalTopics} topics completed
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={getStatusBadgeClassName(module.status)}>
                      {module.status}
                    </Badge>
                    <Badge variant="secondary" className="bg-muted/60">
                      Avg score {module.averageScore}%
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Completion</span>
                    <span>{module.completionPercent}%</span>
                  </div>
                  <Progress value={module.completionPercent} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-8 text-center text-sm text-muted-foreground">
            Your learning board will appear here once module progress data is available.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
