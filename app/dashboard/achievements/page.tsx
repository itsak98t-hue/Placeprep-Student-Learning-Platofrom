"use client"

import Link from "next/link"
import { Lock, Trophy, Unlock } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/providers/AuthProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAchievements } from "@/hooks/useAchievements"
import { useStreak } from "@/hooks/useStreak"
import { useUserAnalytics } from "@/hooks/useUserAnalytics"
import { useUserDocument } from "@/hooks/useUserDocument"

function AchievementSkeleton() {
  return (
    <div className="rounded-2xl border p-5">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-4 h-2 w-full" />
      <Skeleton className="mt-3 h-4 w-24" />
    </div>
  )
}

export default function DashboardAchievementsPage() {
  const { user } = useAuth()
  const { analytics, answers, loading: analyticsLoading } = useUserAnalytics(user?.uid)
  const { streak, loading: streakLoading } = useStreak(user?.uid)
  const { userDoc, loading: userDocLoading } = useUserDocument(user?.uid)
  const achievements = useAchievements(
    user?.uid,
    analytics,
    streak,
    answers.length,
    userDoc?.achievements ?? []
  )

  const loading = analyticsLoading || streakLoading || userDocLoading
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card/95 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Achievements</p>
            <h1 className="text-3xl font-bold tracking-tight">Realtime Milestones</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Every achievement here is computed from your live Firestore activity and unlocked automatically.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {unlockedCount}/{achievements.length} unlocked
          </Badge>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <AchievementSkeleton key={index} />
          ))}
        </div>
      ) : (
        <>
          {answers.length === 0 && (
            <EmptyState
              title="Achievements appear as soon as you start practicing."
              description="Your badge cabinet is live, but there is no answer data yet. Start a practice session and unlock your first milestone."
              ctaLabel="Start Practicing"
              href="/practice"
            />
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {achievements.map((achievement) => {
              const progressPercent =
                achievement.progressTarget > 0
                  ? Math.min(100, Math.round((achievement.progressValue / achievement.progressTarget) * 100))
                  : 0

              return (
                <Card
                  key={achievement.id}
                  className={`border shadow-sm ${
                    achievement.unlocked ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/70"
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{achievement.title}</CardTitle>
                        <CardDescription>{achievement.description}</CardDescription>
                      </div>
                      <div className="rounded-2xl border bg-muted/20 p-3">
                        {achievement.unlocked ? (
                          <Unlock className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={achievement.unlocked ? "default" : "outline"}>
                        {achievement.unlocked ? "Unlocked" : "Locked"}
                      </Badge>
                      {achievement.unlocked && (
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
                          Live
                        </Badge>
                      )}
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    <p className="text-sm text-muted-foreground">{achievement.progressLabel(achievement.progressValue)}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                How unlocking works
              </CardTitle>
              <CardDescription>Unlocks are written back to your user document in real time.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Link href="/practice">
                <Button>Keep Practicing</Button>
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}
