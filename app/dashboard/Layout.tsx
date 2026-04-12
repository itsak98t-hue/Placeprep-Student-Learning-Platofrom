import type { ReactNode } from "react"
import ProtectedRoute from "@/components/providers/ProtectedRoute"

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </ProtectedRoute>
  )
}