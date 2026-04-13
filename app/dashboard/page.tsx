"use client"

import Link from "next/link"
import { CalendarDays, FileText, GraduationCap, MessageSquare, Target } from "lucide-react"

import { CourseCard } from "@/components/CourseCard"
import { EmptyState } from "@/components/EmptyState"
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload"
import { SkeletonCourseCard } from "@/components/SkeletonCourseCard"
import { StatCard } from "@/components/StatCard"
import { LearningProgressBoard } from "@/components/dashboard/LearningProgressBoard"
import { PerformanceTimeline } from "@/components/dashboard/PerformanceTimeline"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCourses } from "@/hooks/useCourses"
import { useStreak } from "@/hooks/useStreak"
import { useUserAnalytics } from "@/hooks/useUserAnalytics"
import { buildLearningModules, buildPerformanceTimeline } from "@/utils/computeAnalytics"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { answers, analytics, loading: analyticsLoading } = useUserAnalytics(user?.uid)
  const { courses, loading: coursesLoading } = useCourses()
  const { streak, loading: streakLoading } = useStreak(user?.uid)

  const loading = authLoading || analyticsLoading || coursesLoading || streakLoading
  const hasTrackedAnswers = answers.length > 0
  const timeline = buildPerformanceTimeline(answers, 8)
  const learningModules = buildLearningModules(courses, analytics)

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card/95 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border bg-muted/20">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt={user.displayName ?? "User"} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-semibold text-primary">
                  {user?.displayName?.slice(0, 1).toUpperCase() ?? "P"}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Realtime Dashboard</p>
              <h1 className="text-3xl font-bold tracking-tight">{user?.displayName ?? "PlacePrep Student"}</h1>
              <p className="text-sm text-muted-foreground">
                {user?.email ?? "Sign in to track your placement preparation live from Firestore."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user?.uid && <ProfilePhotoUpload uid={user.uid} />}
            <Link href="/practice">
              <Button>Start Practicing</Button>
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCourseCard key={index} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCourseCard key={index} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Avg Score"
              value={`${analytics.avgScore}%`}
              description="Mean score across all tracked answers"
              icon={<Target className="h-5 w-5" />}
            />
            <StatCard
              title="Accuracy"
              value={`${analytics.accuracy}%`}
              description="Correct answers divided by total answers"
              icon={<GraduationCap className="h-5 w-5" />}
            />
            <StatCard
              title="Topics Covered"
              value={String(analytics.topicsCovered)}
              description="Distinct course and topic combinations attempted"
              icon={<MessageSquare className="h-5 w-5" />}
            />
            <StatCard
              title="Streak"
              value={`${streak} days`}
              description="Consecutive active days"
              icon={<CalendarDays className="h-5 w-5" />}
            />
          </section>

          {!hasTrackedAnswers && (
            <EmptyState
              title="Your dashboard is live and ready."
              description="You have zero tracked answers right now, so every metric is showing its real empty value. Start your first practice session and this page will fill in automatically."
              ctaLabel="Start Practicing"
              href="/practice"
            />
          )}

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <Card className="border shadow-sm xl:col-span-4">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Course Progress</CardTitle>
                  <CardDescription>
                    Every card below is mapped from the Firestore `courses` collection and hydrated with live answer analytics.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/companies">
                    <Button variant="outline">Companies</Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button variant="outline">Leaderboard</Button>
                  </Link>
                  <Link href="/resources">
                    <Button variant="outline">Resources</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    breakdown={analytics.courseBreakdown[course.id]}
                  />
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <PerformanceTimeline data={timeline} />
            <LearningProgressBoard modules={learningModules} />
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>What this dashboard is using</CardTitle>
                <CardDescription>Nothing here is seeded or hardcoded at runtime.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>- Top summary stats come from live `answers` plus the user document streak.</p>
                <p>- Course cards come from the Firestore `courses` collection.</p>
                <p>- Timeline and learning board are computed from the same live answers.</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Next actions</CardTitle>
                <CardDescription>Use the live data flow to keep building your readiness.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Link href="/practice">
                  <Button className="w-full justify-start">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Continue Practice
                  </Button>
                </Link>
                <Link href="/dashboard/resume">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Open Resume Manager
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </main>
  )
}
