"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  CalendarDays,
  Code,
  FileText,
  GraduationCap,
  MessageSquare,
  UserCircle2,
  Users,
} from "lucide-react"

import { LearningProgressBoard } from "@/components/dashboard/LearningProgressBoard"
import { PerformanceTimeline } from "@/components/dashboard/PerformanceTimeline"
import { useAuth } from "@/components/providers/AuthProvider"
import { behavioralQuestionsById } from "@/data/behavioral"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { getRecentBehavioralAttemptsForUser } from "@/lib/behavioral-attempts"
import { computeBehavioralInsights } from "@/lib/behavioral-insights"
import { getLearningProgress, getPerformanceTimeline } from "@/lib/firestore/progressService"
import type { SavedBehavioralAttempt } from "@/types/behavioral"
import type { LearningModuleProgress, PerformanceTimelinePoint } from "@/types/progress"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [behavioralAttempts, setBehavioralAttempts] = useState<SavedBehavioralAttempt[]>([])
  const [learningProgress, setLearningProgress] = useState<LearningModuleProgress[]>([])
  const [timelineData, setTimelineData] = useState<PerformanceTimelinePoint[]>([])

  const firstName = user?.displayName?.split(" ")[0] || "Student"
  const behavioralInsights = useMemo(
    () => computeBehavioralInsights(behavioralAttempts),
    [behavioralAttempts]
  )
  const behavioralCtaHref = useMemo(() => {
    const latestAttempt = behavioralAttempts[0]
    if (!latestAttempt) {
      return "/company/google"
    }

    const relatedQuestion = behavioralQuestionsById[latestAttempt.questionId]
    if (!relatedQuestion) {
      return "/company/google"
    }

    const weakestCategory = behavioralInsights?.weakestCategory
    if (!weakestCategory) {
      return `/company/${relatedQuestion.company}`
    }

    return `/company/${relatedQuestion.company}?tab=questions&mode=behavioral&category=${encodeURIComponent(weakestCategory)}`
  }, [behavioralAttempts, behavioralInsights?.weakestCategory])

  const stats = useMemo(() => {
    const completedModules = learningProgress.filter((module) => module.completionPercent >= 100).length
    const totalActivity = timelineData.reduce((sum, point) => sum + point.activityCount, 0)
    const averageTimelineScore =
      timelineData.length > 0
        ? Math.round(timelineData.reduce((sum, point) => sum + point.score, 0) / timelineData.length)
        : 0
    const resumeProgress = learningProgress.find((module) => module.moduleId === "resume")

    return {
      completedModules,
      totalActivity,
      averageTimelineScore,
      resumeScore: resumeProgress?.averageScore ?? 0,
    }
  }, [learningProgress, timelineData])

  useEffect(() => {
    if (loading) {
      return
    }

    if (!user?.uid) {
      setBehavioralAttempts([])
      void getLearningProgress("").then(setLearningProgress)
      void getPerformanceTimeline("").then(setTimelineData)
      return
    }

    let isActive = true

    void Promise.allSettled([
      getRecentBehavioralAttemptsForUser(user.uid, 8),
      getLearningProgress(user.uid),
      getPerformanceTimeline(user.uid),
    ]).then((results) => {
      if (!isActive) {
        return
      }

      const [behavioralResult, progressResult, timelineResult] = results

      setBehavioralAttempts(behavioralResult.status === "fulfilled" ? behavioralResult.value : [])
      setLearningProgress(progressResult.status === "fulfilled" ? progressResult.value : [])
      setTimelineData(timelineResult.status === "fulfilled" ? timelineResult.value : [])
    })

    return () => {
      isActive = false
    }
  }, [loading, user?.uid])

  const interviewProgress = learningProgress.find((module) => module.moduleId === "behavioral")
  const resumeBoard = learningProgress.find((module) => module.moduleId === "resume")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border bg-muted">
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircle2 className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {firstName}! Let&apos;s keep your placement prep moving.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/resume">
            <Button className="glow-button">
              <FileText className="mr-2 h-4 w-4" />
              Resume Manager
            </Button>
          </Link>

          <Link href="/dashboard/mock-interview">
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Start Interview
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickActionCard
          title="Resume Manager"
          description="Create, save, and tailor multiple resumes for different companies."
          icon={<FileText className="h-5 w-5" />}
          href="/dashboard/resume"
          cta="Open Resumes"
        />
        <QuickActionCard
          title="Mock Interview"
          description="Practice interview questions in chat mode."
          icon={<MessageSquare className="h-5 w-5" />}
          href="/dashboard/mock-interview"
          cta="Start Practice"
        />
        <QuickActionCard
          title="Calendar"
          description="Track your preparation schedule and consistency."
          icon={<CalendarDays className="h-5 w-5" />}
          href="/dashboard/calendar"
          cta="View Calendar"
        />
        <QuickActionCard
          title="Community"
          description="Connect with students and share preparation tips."
          icon={<Users className="h-5 w-5" />}
          href="/dashboard/community"
          cta="Join Community"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Courses Completed"
          value={String(stats.completedModules)}
          description={`${learningProgress.length} modules tracked`}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatsCard
          title="Practice Activity"
          value={String(stats.totalActivity)}
          description={`Average score ${stats.averageTimelineScore || 0}%`}
          icon={<Code className="h-5 w-5" />}
        />
        <StatsCard
          title="Behavioral Sessions"
          value={String(behavioralAttempts.length)}
          description={behavioralInsights?.secondaryInsight || "Practice feedback updates your insights"}
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          title="Resume Readiness"
          value={`${stats.resumeScore}%`}
          description={resumeBoard ? `${resumeBoard.completionPercent}% module completion` : "Resume module tracked"}
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      <Tabs defaultValue="progress" className="mb-8">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="progress">Your Progress</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>Learning Path Progress</CardTitle>
                <CardDescription>
                  {learningProgress.length > 0 ? `${learningProgress[0].completionPercent}% completion in your top tracked module` : "Module progress overview"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={learningProgress[0]?.completionPercent ?? 0} className="mb-4 h-2" />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {learningProgress[0]?.moduleName ?? "Learning path"}
                  </span>
                  <Link href="/dashboard/study-plan" className="text-sm text-primary hover:underline">
                    Continue
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>Interview Preparation</CardTitle>
                <CardDescription>
                  {interviewProgress
                    ? `${interviewProgress.completedTopics} of ${interviewProgress.totalTopics} practice targets completed`
                    : "Behavioral and interview readiness snapshot"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={interviewProgress?.completionPercent ?? 0} className="mb-4 h-2" />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {interviewProgress?.completionPercent ?? 0}% Complete
                  </span>
                  <Link href="/dashboard/mock-interview" className="text-sm text-primary hover:underline">
                    Continue
                  </Link>
                </div>

                <div className="mt-4 rounded-2xl border bg-muted/20 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Behavioral Insight
                  </p>

                  {behavioralInsights ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium">{behavioralInsights.primaryInsight}</p>
                      <p className="text-sm text-muted-foreground">{behavioralInsights.secondaryInsight}</p>
                      {behavioralAttempts.length >= 2 ? (
                        <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            Category Insight
                          </p>
                          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                            {behavioralInsights.strongestCategory && (
                              <p>
                                <span className="font-medium text-foreground">Strongest:</span> {behavioralInsights.strongestCategory}
                              </p>
                            )}
                            {behavioralInsights.weakestCategory && (
                              <p>
                                <span className="font-medium text-foreground">Needs work:</span> {behavioralInsights.weakestCategory}
                              </p>
                            )}
                            {behavioralInsights.mostPracticedCategory && (
                              <p>
                                <span className="font-medium text-foreground">Most practiced:</span> {behavioralInsights.mostPracticedCategory}
                              </p>
                            )}
                            {behavioralInsights.leastPracticedCategory &&
                              behavioralInsights.leastPracticedCategory !== behavioralInsights.mostPracticedCategory && (
                                <p>
                                  <span className="font-medium text-foreground">Try practicing more:</span> {behavioralInsights.leastPracticedCategory}
                                </p>
                              )}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-3">
                          <p className="text-sm text-muted-foreground">
                            Practice more questions to unlock category insights.
                          </p>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <p className="text-xs text-muted-foreground">
                          Most common result: {behavioralInsights.mostCommonLabel}.{" "}
                          {behavioralInsights.weakestCategory
                            ? `Practice more ${behavioralInsights.weakestCategory.toLowerCase()} questions.`
                            : behavioralInsights.recommendation}
                        </p>
                        <Link href={behavioralCtaHref}>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                            {behavioralInsights.weakestCategory ? "Practice this category" : "Practice now"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        Complete a behavioral practice to unlock insights.
                      </p>
                      <Link href={behavioralCtaHref}>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          Practice now
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <PerformanceTimeline data={timelineData} />
          <LearningProgressBoard modules={learningProgress} />
        </TabsContent>

        <TabsContent value="upcoming">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your scheduled activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Mock Interview: System Design</p>
                    <p className="text-sm text-muted-foreground">Tomorrow, 2:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Workshop: Resume Building</p>
                    <p className="text-sm text-muted-foreground">Friday, 6:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Coding Contest</p>
                    <p className="text-sm text-muted-foreground">Saturday, 10:00 AM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommended">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <RecommendedCard
              title="Data Structures & Algorithms"
              description="Master the fundamentals for technical interviews"
              link="/courses/dsa"
            />
            <RecommendedCard
              title="System Design Interview"
              description="Learn how to design scalable systems"
              link="/courses/system-design"
            />
            <RecommendedCard
              title="Behavioral Interview Prep"
              description="Practice answering common behavioral questions"
              link="/courses/behavioral"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatsCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function RecommendedCard({
  title,
  description,
  link,
}: {
  title: string
  description: string
  link: string
}) {
  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href={link}>
          <Button variant="outline" className="w-full">
            View Course
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
  cta,
}: {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  cta: string
}) {
  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href={href}>
          <Button variant="outline" className="w-full justify-between">
            {cta}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
