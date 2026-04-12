"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { PerformanceTimelinePoint } from "@/types/progress"

type PerformanceTimelineProps = {
  data: PerformanceTimelinePoint[]
}

const chartConfig = {
  score: {
    label: "Average Score",
    color: "hsl(var(--primary))",
  },
  activityCount: {
    label: "Activity Count",
    color: "hsl(var(--muted-foreground))",
  },
}

export function PerformanceTimeline({ data }: PerformanceTimelineProps) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Performance Timeline</CardTitle>
        <CardDescription>Track score trend and practice activity over time.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <LineChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--color-score)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-score)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-8 text-center text-sm text-muted-foreground">
            Complete practice sessions to unlock your performance timeline.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
