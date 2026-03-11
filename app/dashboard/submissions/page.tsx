import { Code2 } from "lucide-react"

import { DashboardFeaturePage } from "@/components/dashboard/DashboardFeaturePage"

export default function DashboardSubmissionsPage() {
  return (
    <DashboardFeaturePage
      title="My Submissions"
      description="Track coding attempts, practice history, and submission patterns in one place."
      icon={Code2}
      primaryActionHref="/practice"
      primaryActionLabel="Open Practice"
    />
  )
}
