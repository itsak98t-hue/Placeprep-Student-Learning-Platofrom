"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Flame, NotebookPen, Sparkles } from "lucide-react"

import { ProgressStat } from "@/components/practice/ProgressStat"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  ACTIVITY_CALENDAR_STORAGE_KEY,
  ACTIVITY_FOCUS_OPTIONS,
  buildCalendarDays,
  calculateCurrentStreak,
  countActiveDays,
  countActiveDaysForMonth,
  dayLabel,
  formatDateKey,
  getRecentActivity,
  monthLabel,
  normalizeActivityEntries,
  parseDateKey,
  type ActivityEntry,
  type ActivityFocus,
} from "@/lib/activity-calendar"

type TechnicalSnapshot = {
  solved: number
  attempted: number
  bookmarked: number
}

type BehavioralSnapshot = {
  prepared: number
  bookmarked: number
}

const defaultTechnicalSnapshot: TechnicalSnapshot = {
  solved: 0,
  attempted: 0,
  bookmarked: 0,
}

const defaultBehavioralSnapshot: BehavioralSnapshot = {
  prepared: 0,
  bookmarked: 0,
}

function readArrayCount(storageKey: string, field: string) {
  if (typeof window === "undefined") {
    return 0
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return 0
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>
    return Array.isArray(parsed[field]) ? parsed[field].length : 0
  } catch {
    return 0
  }
}

export function ActivityCalendar() {
  const [hydrated, setHydrated] = useState(false)
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const todayKey = formatDateKey(new Date())
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey)
  const [entries, setEntries] = useState<Record<string, ActivityEntry>>({})
  const [technicalSnapshot, setTechnicalSnapshot] = useState<TechnicalSnapshot>(defaultTechnicalSnapshot)
  const [behavioralSnapshot, setBehavioralSnapshot] = useState<BehavioralSnapshot>(defaultBehavioralSnapshot)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      const raw = window.localStorage.getItem(ACTIVITY_CALENDAR_STORAGE_KEY)
      if (raw) {
        setEntries(normalizeActivityEntries(JSON.parse(raw)))
      }
    } catch {
      setEntries({})
    }

    setTechnicalSnapshot({
      solved: readArrayCount("placeprep-question-progress", "solved"),
      attempted: readArrayCount("placeprep-question-progress", "attempted"),
      bookmarked: readArrayCount("placeprep-question-progress", "bookmarked"),
    })

    setBehavioralSnapshot({
      prepared: readArrayCount("placeprep-behavioral-progress", "prepared"),
      bookmarked: readArrayCount("placeprep-behavioral-progress", "bookmarked"),
    })

    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.setItem(ACTIVITY_CALENDAR_STORAGE_KEY, JSON.stringify(entries))
    } catch {
      // Ignore storage issues so the calendar remains usable.
    }
  }, [entries, hydrated])

  const calendarDays = useMemo(() => buildCalendarDays(monthCursor), [monthCursor])
  const selectedEntry = entries[selectedDateKey] || { focuses: [], note: "" }
  const totalActiveDays = useMemo(() => countActiveDays(entries), [entries])
  const activeDaysThisMonth = useMemo(() => countActiveDaysForMonth(entries, monthCursor), [entries, monthCursor])
  const currentStreak = useMemo(() => calculateCurrentStreak(entries), [entries])
  const recentActivity = useMemo(() => getRecentActivity(entries, 6), [entries])

  const updateEntry = (updater: (current: ActivityEntry) => ActivityEntry) => {
    setEntries((currentEntries) => {
      const current = currentEntries[selectedDateKey] || { focuses: [], note: "" }
      const next = updater(current)
      const hasContent = next.focuses.length > 0 || next.note.trim().length > 0

      if (!hasContent) {
        const { [selectedDateKey]: _removed, ...rest } = currentEntries
        return rest
      }

      return {
        ...currentEntries,
        [selectedDateKey]: next,
      }
    })
  }

  const toggleFocus = (focus: ActivityFocus) => {
    updateEntry((current) => ({
      ...current,
      focuses: current.focuses.includes(focus)
        ? current.focuses.filter((item) => item !== focus)
        : [...current.focuses, focus],
    }))
  }

  const markTodayActive = () => {
    setSelectedDateKey(todayKey)
    setMonthCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    setEntries((currentEntries) => ({
      ...currentEntries,
      [todayKey]: currentEntries[todayKey] || {
        focuses: ["Technical"],
        note: "",
      },
    }))
  }

  const monthOffset = (direction: number) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1))
  }

  const intensityClass = (entry?: ActivityEntry) => {
    const score = (entry?.focuses.length || 0) + (entry?.note.trim() ? 1 : 0)

    if (score >= 4) return "bg-emerald-500/30 border-emerald-400/60"
    if (score === 3) return "bg-cyan-500/25 border-cyan-400/50"
    if (score >= 1) return "bg-primary/20 border-primary/40"
    return "bg-background/40 border-border/60"
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="bg-gradient-to-r from-primary/15 via-blue-500/10 to-cyan-500/15 p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 shadow-sm">
                <CalendarDays className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Activity Calendar</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Log focused prep days, track consistency, and keep your technical, behavioral, resume, and interview work visible in one place.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={markTodayActive}>Mark Today Active</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDateKey(todayKey)
                  setMonthCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
                }}
              >
                Jump to Today
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ProgressStat label="Current Streak" value={`${currentStreak} day${currentStreak === 1 ? "" : "s"}`} />
        <ProgressStat label="Active This Month" value={`${activeDaysThisMonth}`} />
        <ProgressStat label="Total Logged Days" value={`${totalActiveDays}`} />
        <ProgressStat label="Today" value={entries[todayKey] ? "Active" : "Open"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Card className="border shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{monthLabel(monthCursor)}</CardTitle>
                <CardDescription>Select any date to log prep focus areas and notes.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => monthOffset(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => monthOffset(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day) => {
                const entry = entries[day.key]
                const selected = day.key === selectedDateKey

                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDateKey(day.key)}
                    className={`min-h-[78px] rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                      day.inCurrentMonth ? "text-foreground" : "text-muted-foreground/50"
                    } ${selected ? "ring-2 ring-primary/60" : ""} ${intensityClass(entry)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-sm font-semibold ${day.isToday ? "text-primary" : ""}`}>
                        {day.date.getDate()}
                      </span>
                      {entry && (
                        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                          {entry.focuses.length || (entry.note.trim() ? 1 : 0)}x
                        </span>
                      )}
                    </div>
                    {entry?.focuses.length ? (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {entry.focuses.slice(0, 2).map((focus) => (
                          <Badge key={focus} variant="outline" className="border-white/20 bg-background/60 text-[10px]">
                            {focus}
                          </Badge>
                        ))}
                        {entry.focuses.length > 2 && (
                          <Badge variant="outline" className="border-white/20 bg-background/60 text-[10px]">
                            +{entry.focuses.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <LegendDot className="bg-background/40 border-border/60" label="No activity" />
              <LegendDot className="bg-primary/20 border-primary/40" label="Some activity" />
              <LegendDot className="bg-cyan-500/25 border-cyan-400/50" label="Focused session" />
              <LegendDot className="bg-emerald-500/30 border-emerald-400/60" label="Heavy prep day" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>{dayLabel(parseDateKey(selectedDateKey))}</CardTitle>
              <CardDescription>Mark the prep tracks you worked on and keep a quick note.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_FOCUS_OPTIONS.map((focus) => {
                  const active = selectedEntry.focuses.includes(focus)

                  return (
                    <Button
                      key={focus}
                      type="button"
                      variant={active ? "default" : "outline"}
                      onClick={() => toggleFocus(focus)}
                    >
                      {focus}
                    </Button>
                  )
                })}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Daily Note</p>
                <Textarea
                  className="min-h-[140px] text-sm leading-6"
                  placeholder="What did you practice today? Capture one win, one blocker, or the next thing to revisit."
                  value={selectedEntry.note}
                  onChange={(event) =>
                    updateEntry((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setEntries((currentEntries) => {
                      const { [selectedDateKey]: _removed, ...rest } = currentEntries
                      return rest
                    })
                  }
                >
                  Clear This Day
                </Button>
                <Badge variant="outline" className="px-3 py-1">
                  {selectedEntry.focuses.length} focus area{selectedEntry.focuses.length === 1 ? "" : "s"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Prep Snapshot
              </CardTitle>
              <CardDescription>Live totals pulled from your existing technical and behavioral progress storage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Technical</p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <SnapshotStat label="Solved" value={technicalSnapshot.solved} />
                  <SnapshotStat label="Attempted" value={technicalSnapshot.attempted} />
                  <SnapshotStat label="Bookmarked" value={technicalSnapshot.bookmarked} />
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Behavioral</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <SnapshotStat label="Prepared" value={behavioralSnapshot.prepared} />
                  <SnapshotStat label="Bookmarked" value={behavioralSnapshot.bookmarked} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest logged prep days.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {hydrated && recentActivity.length > 0 ? (
                recentActivity.map((item) => (
                  <div key={item.key} className="rounded-2xl border bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{item.label}</p>
                      <Badge variant="outline">{item.entry.focuses.length || 1} touchpoint{(item.entry.focuses.length || 1) === 1 ? "" : "s"}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.entry.focuses.map((focus) => (
                        <Badge key={`${item.key}-${focus}`} variant="outline">
                          {focus}
                        </Badge>
                      ))}
                    </div>
                    {item.entry.note.trim() ? (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.entry.note}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                  Start logging daily prep and your recent activity will appear here.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NotebookPen className="h-4 w-4 text-primary" />
                How To Use It
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
              <p>Select a date and mark what you worked on.</p>
              <p>Add a short note so future you remembers what clicked or what still needs revision.</p>
              <p>Use the streak and monthly totals to keep your prep rhythm visible.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SnapshotStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-background/60 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full border ${className}`} />
      <span>{label}</span>
    </div>
  )
}
