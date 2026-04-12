import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { UserStatsResponse } from "@/types/coding"

type UserCodingStatsCardProps = {
  stats: UserStatsResponse | null
  isLoading: boolean
  error: string | null
}

const TOPIC_LABELS: Record<string, string> = {
  arrays: "Arrays",
  strings: "Strings",
  binary_search: "Binary Search",
  trees: "Trees",
  graphs: "Graphs",
  dp: "Dynamic Programming",
  sliding_window: "Sliding Window",
  recursion: "Recursion",
}

function formatTopicLabel(topic: string): string {
  if (TOPIC_LABELS[topic]) {
    return TOPIC_LABELS[topic]
  }

  return topic
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export function UserCodingStatsCard({
  stats,
  isLoading,
  error,
}: UserCodingStatsCardProps) {
  const sortedTopics = stats
    ? Object.entries(stats.topic_stats)
        .sort(([, leftStats], [, rightStats]) => rightStats.weakness_score - leftStats.weakness_score)
        .slice(0, 4)
    : []

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Your Coding Stats</CardTitle>
        <CardDescription>
          Topic-level progress from your coding attempts. We use this to steer the next recommendation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">
            {error}
          </div>
        ) : sortedTopics.length > 0 ? (
          <div className="space-y-4">
            {sortedTopics.map(([topic, topicStats]) => (
              <div key={topic} className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{formatTopicLabel(topic)}</p>
                    <p className="text-sm text-muted-foreground">
                      Attempted {topicStats.attempted} times - Success rate {Math.round(topicStats.success_rate * 100)}%
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    Mastery {Math.round(topicStats.mastery_score * 100)}%
                  </p>
                </div>
                <Progress value={Math.round(topicStats.mastery_score * 100)} className="mt-3 h-2.5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
            No coding stats yet. Log your first attempt and PlacePrep will start adapting recommendations.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
