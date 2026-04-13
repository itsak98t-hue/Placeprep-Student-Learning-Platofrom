"use client"

import { useMemo, useState } from "react"
import { ChevronDown, Sparkles } from "lucide-react"

import { SkeletonCourseCard } from "@/components/SkeletonCourseCard"
import { useAuth } from "@/components/providers/AuthProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCourses } from "@/hooks/useCourses"
import { useTopicGuide } from "@/hooks/useTopicGuide"
import { useUserAnalytics } from "@/hooks/useUserAnalytics"

function TopicGuideRow({
  uid,
  courseId,
  topicId,
  isCompleted,
  score,
}: {
  uid: string | null | undefined
  courseId: string
  topicId: string
  isCompleted: boolean
  score?: number
}) {
  const { content, loading, fetchOrGenerate } = useTopicGuide(uid, courseId, topicId)

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{topicId.replace(/-/g, " ")}</p>
            <Badge variant={isCompleted ? "default" : "outline"}>
              {isCompleted ? "Completed" : "Not started"}
            </Badge>
            {typeof score === "number" && (
              <Badge variant="secondary" className="bg-muted/50">
                {score}% score
              </Badge>
            )}
          </div>
          {!content && (
            <p className="text-sm text-muted-foreground">
              Click "Generate Guide" to get an AI-powered study plan.
            </p>
          )}
        </div>

        <Button variant="outline" onClick={() => void fetchOrGenerate()} disabled={loading || !uid}>
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "Generating..." : "Generate Guide"}
        </Button>
      </div>

      {!uid && (
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to generate and save personalized AI guides for this topic.
        </p>
      )}

      {content && (
        <div className="prose prose-invert mt-4 max-w-none rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 text-sm leading-7">
          {content}
        </div>
      )}
    </div>
  )
}

export default function ResourcesPage() {
  const { user } = useAuth()
  const { courses, loading: coursesLoading } = useCourses()
  const { answers, analytics, loading: analyticsLoading } = useUserAnalytics(user?.uid)
  const [openCourseId, setOpenCourseId] = useState<string | null>(null)

  const loading = coursesLoading || analyticsLoading
  const breakdownMap = analytics.courseBreakdown

  const topicScores = useMemo(() => {
    return answers.reduce<Record<string, number>>((accumulator, answer) => {
      if (!answer.courseId || !answer.topicId || typeof answer.score !== "number") {
        return accumulator
      }

      accumulator[`${answer.courseId}:${answer.topicId}`] = answer.score
      return accumulator
    }, {})
  }, [answers])

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resource Library</p>
        <h1 className="text-3xl font-bold tracking-tight">AI-Powered Resources</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Every section below maps directly from the Firestore `courses` collection and shows progress computed from your live answers.
        </p>
      </div>

      {!loading && analytics.topicsCovered === 0 && (
        <Card className="border border-dashed shadow-sm">
          <CardContent className="p-5 text-sm text-muted-foreground">
            You have not practiced yet, so every progress value is showing its real zero state. You can still generate topic guides now and your completion stats will start updating after your first session.
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCourseCard key={index} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => {
            const breakdown = breakdownMap[course.id]
            const isOpen = openCourseId === course.id
            return (
              <Card key={course.id} className="border shadow-sm">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setOpenCourseId((current) => (current === course.id ? null : course.id))}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle>{course.label}</CardTitle>
                        <CardDescription>
                          {breakdown?.topicsCovered ?? 0}/{course.totalTopics} topics covered
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{breakdown?.avgScore ?? 0}% Avg</Badge>
                        <Badge variant="outline" className="capitalize">
                          {breakdown?.status?.replace("-", " ") ?? "not started"}
                        </Badge>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isOpen && (
                  <CardContent className="space-y-4">
                    {(course.topics ?? []).map((topic) => {
                      const topicId = topic.toLowerCase().replace(/\s+/g, "-")
                      return (
                        <TopicGuideRow
                          key={`${course.id}-${topicId}`}
                          uid={user?.uid}
                          courseId={course.id}
                          topicId={topicId}
                          isCompleted={answers.some(
                            (answer) => answer.courseId === course.id && answer.topicId === topicId
                          )}
                          score={topicScores[`${course.id}:${topicId}`]}
                        />
                      )
                    })}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
