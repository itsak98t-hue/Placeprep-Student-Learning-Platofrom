"use client"

import { useMemo, useState } from "react"

import { EmptyState } from "@/components/EmptyState"
import { useAuth } from "@/components/providers/AuthProvider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCourses } from "@/hooks/useCourses"
import { useUserAnalytics } from "@/hooks/useUserAnalytics"

const PAGE_SIZE = 20

type CorrectnessFilter = "all" | "correct" | "incorrect"

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function toInputDate(isoString: string) {
  return new Date(isoString).toISOString().slice(0, 10)
}

export default function DashboardSubmissionsPage() {
  const { user } = useAuth()
  const { answers, analytics, loading: analyticsLoading } = useUserAnalytics(user?.uid)
  const { courses, loading: coursesLoading } = useCourses()
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [correctnessFilter, setCorrectnessFilter] = useState<CorrectnessFilter>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [page, setPage] = useState(1)

  const loading = analyticsLoading || coursesLoading
  const courseLabelMap = useMemo(
    () => new Map(courses.map((course) => [course.id, course.label])),
    [courses]
  )

  const filteredAnswers = useMemo(() => {
    const sorted = [...answers].sort(
      (left, right) => new Date(right.answeredAt ?? right.createdAt).getTime() - new Date(left.answeredAt ?? left.createdAt).getTime()
    )

    return sorted.filter((answer) => {
      const answerDate = toInputDate(answer.answeredAt ?? answer.createdAt)
      const matchesCourse = courseFilter === "all" || answer.courseId === courseFilter
      const matchesCorrectness =
        correctnessFilter === "all" ||
        (correctnessFilter === "correct" && answer.isCorrect === true) ||
        (correctnessFilter === "incorrect" && answer.isCorrect === false)
      const matchesStart = !startDate || answerDate >= startDate
      const matchesEnd = !endDate || answerDate <= endDate

      return matchesCourse && matchesCorrectness && matchesStart && matchesEnd
    })
  }, [answers, correctnessFilter, courseFilter, endDate, startDate])

  const pageCount = Math.max(1, Math.ceil(filteredAnswers.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paginatedAnswers = filteredAnswers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const filteredSummary = useMemo(() => {
    if (filteredAnswers.length === 0) {
      return { total: 0, avgScore: 0, accuracy: 0 }
    }

    const avgScore = Math.round(
      filteredAnswers.reduce((sum, answer) => sum + (answer.score ?? answer.rating ?? 0), 0) / filteredAnswers.length
    )
    const scorable = filteredAnswers.filter((answer) => typeof answer.isCorrect === "boolean")
    const accuracy =
      scorable.length > 0
        ? Math.round((scorable.filter((answer) => answer.isCorrect === true).length / scorable.length) * 100)
        : 0

    return {
      total: filteredAnswers.length,
      avgScore,
      accuracy,
    }
  }, [filteredAnswers])

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card/95 p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Submissions</p>
          <h1 className="text-3xl font-bold tracking-tight">Submission History</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            This list is driven by your live Firestore answers and updates as soon as new submissions are saved.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="space-y-4">
          <Card className="border shadow-sm">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardContent className="space-y-3 p-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : answers.length === 0 ? (
        <EmptyState
          title="No submissions yet. Start practicing!"
          description="Once you submit answers, your full history will appear here with filters and live summaries."
          ctaLabel="Start Practicing"
          href="/practice"
        />
      ) : (
        <>
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Submission Summary</CardTitle>
              <CardDescription>Computed from the currently filtered answer set.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <SummaryStat label="Total submissions" value={String(filteredSummary.total)} />
              <SummaryStat label="Average score" value={`${filteredSummary.avgScore}%`} />
              <SummaryStat label="Accuracy" value={`${filteredSummary.accuracy}%`} />
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Refine the list by course, date, or correctness.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <Select
                value={courseFilter}
                onValueChange={(value) => {
                  setCourseFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={correctnessFilter}
                onValueChange={(value) => {
                  setCorrectnessFilter(value as CorrectnessFilter)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All results" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All results</SelectItem>
                  <SelectItem value="correct">Correct only</SelectItem>
                  <SelectItem value="incorrect">Incorrect only</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value)
                  setPage(1)
                }}
              />
              <Input
                type="date"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value)
                  setPage(1)
                }}
              />
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Recent submissions</CardTitle>
              <CardDescription>Sorted by most recent first.</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAnswers.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No submissions match the current filters.
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Topic</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Time Taken</TableHead>
                        <TableHead>Answered At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAnswers.map((answer) => (
                        <TableRow key={answer.id ?? `${answer.questionId}-${answer.createdAt}`}>
                          <TableCell>{courseLabelMap.get(answer.courseId ?? "") ?? answer.courseId ?? "General"}</TableCell>
                          <TableCell>{answer.topic ?? answer.topicId ?? "General"}</TableCell>
                          <TableCell>{answer.score ?? answer.rating ?? 0}%</TableCell>
                          <TableCell>
                            <Badge variant={answer.isCorrect ? "default" : "outline"}>
                              {answer.isCorrect === true ? "Correct" : answer.isCorrect === false ? "Incorrect" : "Not scored"}
                            </Badge>
                          </TableCell>
                          <TableCell>{answer.timeTakenSeconds ?? 0}s</TableCell>
                          <TableCell>{formatDateTime(answer.answeredAt ?? answer.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {pageCount}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setPage((value) => Math.max(1, value - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                        disabled={currentPage === pageCount}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border border-dashed shadow-sm">
            <CardContent className="p-5 text-sm text-muted-foreground">
              Overall live totals right now: {answers.length} submissions, {analytics.avgScore}% average score, and {analytics.accuracy}% accuracy across your full answer history.
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-muted/10 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
