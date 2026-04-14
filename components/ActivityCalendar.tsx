"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Calendar, Flame } from "lucide-react"

import { useAuth } from "@/components/providers/AuthProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useActivityFeed } from "@/hooks/useActivityFeed"
import { useStreak } from "@/hooks/useStreak"

type CalendarCell = {
  key: string
  date: Date
  count: number
  averageScore: number
  level: 0 | 1 | 2 | 3 | 4
}

function toDateKey(date: Date) {
  return date.toISOString().split("T")[0]
}

function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count >= 8) return 4
  if (count >= 4) return 3
  if (count >= 1) return 2
  return 0
}

function buildCalendar(activity: Array<{ dateKey: string; count: number; averageScore: number }>) {
  const activityMap = new Map(activity.map((entry) => [entry.dateKey, entry]))
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 83)

  const days: CalendarCell[] = []
  for (let index = 0; index < 84; index += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = toDateKey(date)
    const entry = activityMap.get(key)
    days.push({
      key,
      date,
      count: entry?.count ?? 0,
      averageScore: entry?.averageScore ?? 0,
      level: getLevel(entry?.count ?? 0),
    })
  }

  const weeks: CalendarCell[][] = []
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7))
  }

  return weeks
}

export default function ActivityCalendar() {
  const { user } = useAuth()
  const { dailyActivity, loading } = useActivityFeed(user?.uid)
  const { streak } = useStreak(user?.uid)
  const weeks = useMemo(() => buildCalendar(dailyActivity), [dailyActivity])

  return (
    <Card className="glass-card border-0 shadow-xl">
      <CardHeader className="pb-6 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 p-3">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Activity Calendar</CardTitle>
        <CardDescription className="text-base">
          Your last 12 weeks of real practice activity, pulled straight from Firestore.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <TooltipProvider>
          <div className="space-y-6">
            <div className="activity-calendar">
              {weeks.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="flex flex-col gap-1.5">
                  {week.map((day) => (
                    <Tooltip key={day.key}>
                      <TooltipTrigger asChild>
                        <div
                          className={`activity-day activity-level-${day.level} cursor-pointer`}
                          aria-label={`${day.count} answers on ${day.date.toLocaleDateString()}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="border bg-popover shadow-lg">
                        <p className="text-xs font-medium">
                          {day.date.toLocaleDateString()} • {day.count} {day.count === 1 ? "answer" : "answers"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Avg score: {day.count > 0 ? `${day.averageScore}%` : "No attempts"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1.5">
                <div className="activity-day activity-level-0" />
                <div className="activity-day activity-level-1" />
                <div className="activity-day activity-level-2" />
                <div className="activity-day activity-level-3" />
                <div className="activity-day activity-level-4" />
              </div>
              <span>More</span>
            </div>

            <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-4 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <Flame className="h-5 w-5 text-orange-600" />
                <span className="text-lg font-bold text-orange-600">{streak}</span>
              </div>
              <p className="text-sm font-medium">Current Streak</p>
              <p className="text-xs text-muted-foreground">consecutive active days</p>
            </div>

            <div className="space-y-4 text-center">
              <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white">
                {loading
                  ? "Loading activity..."
                  : dailyActivity.length > 0
                    ? "Consistency compounds. Keep the calendar green."
                    : "Start your first session to light up the calendar."}
              </Badge>

              <Button asChild className="w-full glow-button">
                <Link href="/practice">Start Practicing</Link>
              </Button>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
