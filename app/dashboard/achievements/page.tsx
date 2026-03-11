import { Trophy } from "lucide-react"

import { DashboardFeaturePage } from "@/components/dashboard/DashboardFeaturePage"

export default function DashboardAchievementsPage() {
  return (
    <DashboardFeaturePage
      title="Achievements"
      description="See badges, milestones, and wins collected across your placement prep journey."
      icon={Trophy}
    />
  )
}
