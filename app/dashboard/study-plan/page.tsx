import { GraduationCap } from "lucide-react"

import { DashboardFeaturePage } from "@/components/dashboard/DashboardFeaturePage"

export default function DashboardStudyPlanPage() {
  return (
    <DashboardFeaturePage
      title="Study Plan"
      description="Organize your placement roadmap, focus areas, and next learning priorities."
      icon={GraduationCap}
    />
  )
}
