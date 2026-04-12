import { Settings } from "lucide-react"

import { DashboardFeaturePage } from "@/components/dashboard/DashboardFeaturePage"

export default function DashboardSettingsPage() {
  return (
    <DashboardFeaturePage
      title="Settings"
      description="Manage account preferences, profile configuration, and personal setup."
      icon={Settings}
    />
  )
}
