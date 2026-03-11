import { MessageSquare } from "lucide-react"

import { DashboardFeaturePage } from "@/components/dashboard/DashboardFeaturePage"

export default function DashboardMockInterviewPage() {
  return (
    <DashboardFeaturePage
      title="Mock Interview"
      description="Practice interview sessions, review feedback, and sharpen your communication under pressure."
      icon={MessageSquare}
    />
  )
}
