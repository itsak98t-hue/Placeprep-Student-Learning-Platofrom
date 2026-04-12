"use client"

import { Progress } from "@/components/ui/progress"
import type { ATSAnalysisResult } from "@/types/resume-analysis"

type ATSBreakdownProps = {
  breakdown: ATSAnalysisResult["breakdown"]
}

const BREAKDOWN_LABELS: Array<{
  key: keyof ATSAnalysisResult["breakdown"]
  label: string
  max: number
}> = [
  { key: "sectionCompleteness", label: "Section Completeness", max: 20 },
  { key: "keywordMatch", label: "Keyword Match", max: 30 },
  { key: "formattingSafety", label: "Formatting Safety", max: 15 },
  { key: "contentStrength", label: "Content Strength", max: 15 },
  { key: "quantifiedImpact", label: "Quantified Impact", max: 10 },
  { key: "roleRelevance", label: "Role Relevance", max: 10 },
]

export function ATSBreakdown({ breakdown }: ATSBreakdownProps) {
  return (
    <div className="space-y-4">
      {BREAKDOWN_LABELS.map((item) => {
        const value = breakdown[item.key]
        return (
          <div key={item.key} className="space-y-2 rounded-xl border border-border/70 bg-muted/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground">
                {value}/{item.max}
              </p>
            </div>
            <Progress value={(value / item.max) * 100} className="h-2" />
          </div>
        )
      })}
    </div>
  )
}
