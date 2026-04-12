import { User } from "lucide-react"

import { DashboardFeaturePage } from "@/components/dashboard/DashboardFeaturePage"

export default function DashboardProfilePage() {
  return (
    <DashboardFeaturePage
      title="My Profile"
      description="Your main profile workspace for account details, activity signals, and preparation progress."
      icon={User}
    />
  )
}
