"use client"

import Link from "next/link"
import { RefreshCw } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { useAuth } from "@/components/providers/AuthProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCourses } from "@/hooks/useCourses"
import { useStreak } from "@/hooks/useStreak"
import { useStudyPlan } from "@/hooks/useStudyPlan"
import { useUserAnalytics } from "@/hooks/useUserAnalytics"

function formatGeneratedAt(isoString: string | null) {
  if (!isoString) {
    return "Waiting for first plan"
  }

  return new Date(isoString).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default function DashboardStudyPlanPage() {
  const { user } = useAuth()
  const { analytics, loading: analyticsLoading } = useUserAnalytics(user?.uid)
  const { courses, loading: coursesLoading } = useCourses()
  const { streak, loading: streakLoading } = useStreak(user?.uid)
  const { studyPlan, loading: studyPlanLoading, refreshing, error, refreshPlan, weekId } = useStudyPlan(
    user?.uid,
    analytics,
    courses,
    streak
  )

  const loading = analyticsLoading || coursesLoading || streakLoading || studyPlanLoading
  const hasActivity = analytics.topicsCovered > 0
  const courseLabelMap = new Map(courses.map((course) => [course.id, course.label]))

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card/95 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Study Plan</p>
            <h1 className="text-3xl font-bold tracking-tight">Your Weekly Prep Plan</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              This plan is generated from your weakest courses, your current streak, and the topics you have not attempted yet.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{weekId}</Badge>
            <Button variant="outline" onClick={() => void refreshPlan()} disabled={refreshing || !hasActivity}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh Plan"}
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border shadow-sm">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardContent className="space-y-4 p-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-5 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : !hasActivity ? (
        <EmptyState
          title="Your study plan unlocks after your first practice session."
          description="We need real answer data to identify weak courses, unanswered topics, and the right daily goal."
          ctaLabel="Start Practicing"
          href="/practice"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Plan Inputs</CardTitle>
              <CardDescription>These are the live signals powering the weekly plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border bg-muted/10 p-4">
                  <p className="text-sm text-muted-foreground">Current streak</p>
                  <p className="mt-2 text-2xl font-semibold">{streak} days</p>
                </div>
                <div className="rounded-2xl border bg-muted/10 p-4">
                  <p className="text-sm text-muted-foreground">Daily goal</p>
                  <p className="mt-2 text-2xl font-semibold">{studyPlan?.dailyGoal ?? 0} questions</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Recommended courses</p>
                <div className="flex flex-wrap gap-2">
                  {(studyPlan?.recommendedCourses ?? []).map((courseId) => (
                    <Badge key={courseId} variant="outline">
                      {courseLabelMap.get(courseId) ?? courseId}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Focus topics</p>
                <div className="flex flex-wrap gap-2">
                  {(studyPlan?.focusTopics ?? []).map((topic) => (
                    <Badge key={topic} variant="secondary" className="bg-muted/40">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Last generated: {formatGeneratedAt(studyPlan?.generatedAtIso ?? null)}
              </p>

              {error && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>7-Day Plan</CardTitle>
              <CardDescription>Cached for the week and regenerated only when needed or when you request it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {studyPlan?.planText ? (
                studyPlan.planText
                  .split(/\n+/)
                  .filter((line) => line.trim().length > 0)
                  .map((line, index) => (
                    <div key={`${line}-${index}`} className="rounded-2xl border bg-muted/10 p-4 text-sm leading-7">
                      {line}
                    </div>
                  ))
              ) : (
                <EmptyState
                  title="Your study plan is being prepared."
                  description="Refresh the plan or wait a moment for the weekly study plan to be written into Firestore."
                  ctaLabel="Back to Dashboard"
                  href="/dashboard"
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-medium">Need more input for a better plan?</p>
            <p className="text-sm text-muted-foreground">
              More practice gives the generator better weak-area signals to work from.
            </p>
          </div>
          <Link href="/practice">
            <Button>Go to Practice</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
