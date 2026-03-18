export type ActivityFocus = "Technical" | "Behavioral" | "Resume" | "Interview"

export type ActivityEntry = {
  focuses: ActivityFocus[]
  note: string
}

export type CalendarDay = {
  date: Date
  key: string
  inCurrentMonth: boolean
  isToday: boolean
}

export const ACTIVITY_CALENDAR_STORAGE_KEY = "placeprep-activity-calendar"

export const ACTIVITY_FOCUS_OPTIONS: ActivityFocus[] = [
  "Technical",
  "Behavioral",
  "Resume",
  "Interview",
]

export function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

export function dayLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export function buildCalendarDays(monthDate: Date) {
  const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const startOffset = startOfMonth.getDay()
  const totalSlots = Math.ceil((startOffset + endOfMonth.getDate()) / 7) * 7
  const firstCellDate = new Date(startOfMonth)
  firstCellDate.setDate(startOfMonth.getDate() - startOffset)

  return Array.from({ length: totalSlots }, (_, index) => {
    const date = new Date(firstCellDate)
    date.setDate(firstCellDate.getDate() + index)

    return {
      date,
      key: formatDateKey(date),
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
      isToday: formatDateKey(date) === formatDateKey(new Date()),
    } satisfies CalendarDay
  })
}

export function normalizeActivityEntries(value: unknown): Record<string, ActivityEntry> {
  if (!value || typeof value !== "object") {
    return {}
  }

  const normalized: Record<string, ActivityEntry> = {}

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !entry || typeof entry !== "object") {
      continue
    }

    const candidate = entry as { focuses?: unknown; note?: unknown }
    const focuses = Array.isArray(candidate.focuses)
      ? [...new Set(candidate.focuses.filter((item): item is ActivityFocus => ACTIVITY_FOCUS_OPTIONS.includes(item as ActivityFocus)))]
      : []

    normalized[key] = {
      focuses,
      note: typeof candidate.note === "string" ? candidate.note : "",
    }
  }

  return normalized
}

export function countActiveDays(entries: Record<string, ActivityEntry>) {
  return Object.values(entries).filter((entry) => entry.focuses.length > 0 || entry.note.trim().length > 0).length
}

export function countActiveDaysForMonth(entries: Record<string, ActivityEntry>, monthDate: Date) {
  return Object.entries(entries).filter(([key, entry]) => {
    const date = parseDateKey(key)
    const sameMonth = date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth()
    return sameMonth && (entry.focuses.length > 0 || entry.note.trim().length > 0)
  }).length
}

export function calculateCurrentStreak(entries: Record<string, ActivityEntry>) {
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  while (true) {
    const key = formatDateKey(cursor)
    const entry = entries[key]
    const isActive = !!entry && (entry.focuses.length > 0 || entry.note.trim().length > 0)

    if (!isActive) {
      break
    }

    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function calculateLongestStreak(entries: Record<string, ActivityEntry>) {
  const activeKeys = Object.entries(entries)
    .filter(([, entry]) => entry.focuses.length > 0 || entry.note.trim().length > 0)
    .map(([key]) => key)
    .sort()

  if (activeKeys.length === 0) {
    return 0
  }

  let longest = 1
  let current = 1

  for (let index = 1; index < activeKeys.length; index += 1) {
    const previous = parseDateKey(activeKeys[index - 1])
    const next = parseDateKey(activeKeys[index])
    const diffInDays = Math.round((next.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 1) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  return longest
}

export function buildRecentActivityHeatmap(entries: Record<string, ActivityEntry>, weeks = 12) {
  const totalDays = weeks * 7
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (totalDays - 1))

  const days = Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = formatDateKey(date)
    const entry = entries[key]
    const score = (entry?.focuses.length || 0) + (entry?.note.trim() ? 1 : 0)
    const level = score >= 4 ? 4 : score === 3 ? 3 : score === 2 ? 2 : score === 1 ? 1 : 0

    return {
      key,
      date,
      count: score,
      level,
    }
  })

  const groupedWeeks: Array<typeof days> = []
  for (let index = 0; index < days.length; index += 7) {
    groupedWeeks.push(days.slice(index, index + 7))
  }

  return groupedWeeks
}

export function getRecentActivity(entries: Record<string, ActivityEntry>, limit = 5) {
  return Object.entries(entries)
    .filter(([, entry]) => entry.focuses.length > 0 || entry.note.trim().length > 0)
    .sort(([left], [right]) => (left < right ? 1 : -1))
    .slice(0, limit)
    .map(([key, entry]) => ({
      key,
      label: dayLabel(parseDateKey(key)),
      entry,
    }))
}
