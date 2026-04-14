"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, CheckCircle2, Clock } from "lucide-react"

import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCourses } from "@/hooks/useCourses"
import { useUserAnalytics } from "@/hooks/useUserAnalytics"

export default function StudyPlanSection() {
  const { user } = useAuth()
  const { courses, loading: coursesLoading } = useCourses()
  const { analytics, loading: analyticsLoading } = useUserAnalytics(user?.uid)

  const weakestCourses = courses
    .map((course) => ({
      course,
      breakdown: analytics?.courseBreakdown[course.id],
    }))
    .filter((entry) => entry.breakdown)
    .sort((left, right) => (left.breakdown?.avgScore ?? 0) - (right.breakdown?.avgScore ?? 0))
    .slice(0, 3)

  const genericCourses = courses.slice(0, 3)

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 p-3">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="gradient-text">Study Plans</span>
            <br />
            <span className="text-foreground">That Adapt With You</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            Logged out users see the main learning tracks. Once you practice, PlacePrep surfaces your weakest areas first.
          </p>
        </div>

        {coursesLoading || (user && analyticsLoading) ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-border/70 p-6">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <Skeleton className="mt-4 h-6 w-32" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-4/5" />
                <Skeleton className="mt-6 h-2 w-full" />
                <Skeleton className="mt-6 h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : !user ? (
          <StudyPlanGrid
            cards={genericCourses.map((course) => ({
              id: course.id,
              title: course.label,
              description: `Start building depth across ${course.totalTopics} curated topics in ${course.label}.`,
              progress: 0,
              duration: `${Math.max(2, Math.ceil(course.totalTopics / 4))} weeks`,
              link: `/resources#${course.id}`,
              buttonLabel: "Explore Track",
            }))}
          />
        ) : !analytics || analytics.topicsCovered === 0 ? (
          <Card className="rounded-3xl border border-dashed border-border/70 bg-muted/[0.08] px-6 py-12 text-center">
            <CardHeader className="space-y-3">
              <CardTitle>Complete your first session for a personalized plan</CardTitle>
              <CardDescription>
                As soon as you solve a few questions, we’ll replace these placeholders with your three weakest course areas.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button asChild className="glow-button">
                <Link href="/practice">Start Practicing</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <StudyPlanGrid
            cards={weakestCourses.map(({ course, breakdown }) => ({
              id: course.id,
              title: course.label,
              description: `Your current weak area with ${breakdown?.avgScore ?? 0}% average score and ${breakdown?.topicsCovered ?? 0}/${course.totalTopics} topics covered.`,
              progress:
                course.totalTopics > 0
                  ? Math.round(((breakdown?.topicsCovered ?? 0) / course.totalTopics) * 100)
                  : 0,
              duration: `${Math.max(1, Math.ceil((course.totalTopics - (breakdown?.topicsCovered ?? 0)) / 3))} weeks`,
              link: `/practice?course=${course.id}`,
              buttonLabel: "Practice Weak Area",
            }))}
          />
        )}

        <div className="mt-12 text-center">
          <Link href="/dashboard/study-plan">
            <Button size="lg" variant="outline" className="group border-primary/20 bg-transparent hover:bg-primary/5">
              Open Full Study Plan
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

function StudyPlanGrid({
  cards,
}: {
  cards: Array<{
    id: string
    title: string
    description: string
    progress: number
    duration: string
    link: string
    buttonLabel: string
  }>
}) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <StudyPlanCard key={card.id} {...card} />
      ))}
    </div>
  )
}

function StudyPlanCard({
  title,
  description,
  progress,
  duration,
  link,
  buttonLabel,
}: {
  title: string
  description: string
  progress: number
  duration: string
  link: string
  buttonLabel: string
}) {
  return (
    <Card className="study-plan-card group">
      <CardHeader>
        <div className="mb-4 flex items-start justify-between">
          <div className="inline-flex rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 p-3 transition-transform duration-300 group-hover:scale-110">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div className="inline-flex items-center rounded-full bg-muted/50 px-3 py-1 text-xs font-medium">
            <Clock className="mr-1 h-3 w-3" />
            {duration}
          </div>
        </div>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="font-semibold text-primary">{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div className="progress-bar rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Link href={link} className="w-full">
          <Button className="w-full group bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
            {progress > 0 ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
            {buttonLabel}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
