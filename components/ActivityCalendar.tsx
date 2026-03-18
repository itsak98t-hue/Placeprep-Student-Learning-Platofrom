"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Calendar, Flame, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ACTIVITY_CALENDAR_STORAGE_KEY,
  buildRecentActivityHeatmap,
  calculateCurrentStreak,
  calculateLongestStreak,
  normalizeActivityEntries,
  type ActivityEntry,
} from "@/lib/activity-calendar"

export default function ActivityCalendar() {
  const [entries, setEntries] = useState<Record<string, ActivityEntry>>({})

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const readEntries = () => {
      try {
        const raw = window.localStorage.getItem(ACTIVITY_CALENDAR_STORAGE_KEY)
        setEntries(raw ? normalizeActivityEntries(JSON.parse(raw)) : {})
      } catch {
        setEntries({})
      }
    }

    readEntries()

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ACTIVITY_CALENDAR_STORAGE_KEY) {
        readEntries()
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const weeks = useMemo(() => buildRecentActivityHeatmap(entries, 12), [entries])
  const currentStreak = useMemo(() => calculateCurrentStreak(entries), [entries])
  const longestStreak = useMemo(() => calculateLongestStreak(entries), [entries])

  return (
    <Card className="glass-card border-0 shadow-xl">
      <CardHeader className="pb-6 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 p-3">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Activity Calendar</CardTitle>
        <CardDescription className="text-base">Your learning and practice journey</CardDescription>
      </CardHeader>

      <CardContent>
        <TooltipProvider>
          <div className="space-y-6">
            <div className="activity-calendar">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1.5">
                  {week.map((day) => (
                    <Tooltip key={day.key}>
                      <TooltipTrigger asChild>
                        <div
                          className={`activity-day activity-level-${day.level} cursor-pointer`}
                          aria-label={`${day.count} activities on ${day.date.toLocaleDateString()}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="border bg-popover shadow-lg">
                        <p className="text-xs font-medium">
                          {day.count} {day.count === 1 ? "activity" : "activities"}
                        </p>
                        <p className="text-xs text-muted-foreground">{day.date.toLocaleDateString()}</p>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Flame className="h-5 w-5 text-orange-600" />
                  <span className="text-lg font-bold text-orange-600">{currentStreak}</span>
                </div>
                <p className="text-sm font-medium">Current Streak</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>

              <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-bold text-green-600">{longestStreak}</span>
                </div>
                <p className="text-sm font-medium">Longest Streak</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>

            <div className="space-y-4 text-center">
              <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white">
                {currentStreak > 0 ? "Keep the streak alive!" : "Start your first active day!"}
              </Badge>

              <Button asChild className="w-full glow-button">
                <Link href="/dashboard/calendar">Open Full Calendar</Link>
              </Button>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
