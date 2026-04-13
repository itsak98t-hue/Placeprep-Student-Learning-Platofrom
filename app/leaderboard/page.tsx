"use client"

import { Trophy } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { SkeletonCompanyCard } from "@/components/SkeletonCompanyCard"
import { useAuth } from "@/components/providers/AuthProvider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLeaderboard } from "@/hooks/useLeaderboard"

export default function LeaderboardPage() {
  const { user } = useAuth()
  const { entries, loading } = useLeaderboard(user?.uid)

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Realtime Leaderboard</p>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Rank is driven by live Firestore leaderboard documents: average score, streak, and solved problems together determine position.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Top performers
          </CardTitle>
          <CardDescription>Updates automatically whenever a tracked session completes.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonCompanyCard key={index} />
              ))}
            </div>
          ) : entries.length < 2 ? (
            <EmptyState
              title="Be the first on the leaderboard!"
              description="Once more users complete live sessions, the leaderboard will rank everyone here automatically."
              ctaLabel="Start a Session"
              href="/practice"
            />
          ) : (
            <div className="space-y-3">
              {entries.map((entry, index) => {
                const isCurrentUser = entry.uid === user?.uid
                return (
                  <div
                    key={entry.uid}
                    className={`grid grid-cols-1 gap-4 rounded-2xl border p-4 md:grid-cols-[60px_64px_1fr_120px_120px_120px_120px] ${
                      isCurrentUser ? "border-primary/40 bg-primary/[0.05]" : "border-border/70 bg-card"
                    }`}
                  >
                    <div className="text-lg font-semibold text-primary">#{index + 1}</div>
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border bg-muted/20">
                      {entry.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={entry.photoURL} alt={entry.displayName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-primary">
                          {entry.displayName.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{entry.displayName}</p>
                      <Badge variant="outline" className="mt-2">
                        {entry.tier}
                      </Badge>
                    </div>
                    <Metric label="Avg Score" value={`${entry.avgScore}%`} />
                    <Metric label="Streak" value={`🔥 ${entry.streak}`} />
                    <Metric label="Solved" value={String(entry.problemsSolved ?? 0)} />
                    <Metric label="Rank Score" value={String(entry.rankScore ?? 0)} />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
