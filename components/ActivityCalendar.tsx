import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Calendar, Flame, Target } from "lucide-react"

export default function ActivityCalendar() {
  // Generate random activity data for the last 12 weeks (7 days per week)
  const generateActivityData = () => {
    const data = []
    for (let i = 0; i < 12 * 7; i++) {
      const level = Math.floor(Math.random() * 5) // 0-4 activity levels
      data.push({
        date: new Date(Date.now() - (12 * 7 - i) * 24 * 60 * 60 * 1000),
        level,
        count: level === 0 ? 0 : level * Math.floor(Math.random() * 3 + 1),
      })
    }
    return data
  }

  const activityData = generateActivityData()

  // Group by week for display
  const weeks = []
  for (let i = 0; i < activityData.length; i += 7) {
    weeks.push(activityData.slice(i, i + 7))
  }

  return (
    <Card className="glass-card border-0 shadow-xl">
      <CardHeader className="text-center pb-6">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 mb-4 mx-auto">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Activity Calendar</CardTitle>
        <CardDescription className="text-base">Your learning and practice journey</CardDescription>
      </CardHeader>

      <CardContent>
        <TooltipProvider>
          <div className="space-y-6">
            <div className="activity-calendar">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1.5">
                  {week.map((day, dayIndex) => (
                    <Tooltip key={dayIndex}>
                      <TooltipTrigger asChild>
                        <div
                          className={`activity-day activity-level-${day.level} cursor-pointer`}
                          aria-label={`${day.count} activities on ${day.date.toLocaleDateString()}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-popover border shadow-lg">
                        <p className="text-xs font-medium">
                          {day.count} {day.count === 1 ? "activity" : "activities"}
                        </p>
                        <p className="text-xs text-muted-foreground">{day.date.toLocaleDateString()}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1.5">
                <div className="activity-day activity-level-0" />
                <div className="activity-day activity-level-1" />
                <div className="activity-day activity-level-2" />
                <div className="activity-day activity-level-3" />
                <div className="activity-day activity-level-4" />
              </div>
              <span>More</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Flame className="h-5 w-5 text-orange-600" />
                  <span className="text-lg font-bold text-orange-600">7</span>
                </div>
                <p className="text-sm font-medium">Current Streak</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>

              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-bold text-green-600">14</span>
                </div>
                <p className="text-sm font-medium">Longest Streak</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>

            <div className="text-center">
              <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white">
                🎯 Keep up the great work!
              </Badge>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
