import { CalendarDays } from "lucide-react"

import { DashboardFeaturePage } from "@/components/dashboard/DashboardFeaturePage"

export default function DashboardCalendarPage() {
  return (
    <DashboardFeaturePage
      title="Activity Calendar"
      description="Review your consistency, planning rhythm, and upcoming preparation schedule."
      icon={CalendarDays}
    />
  )
}
