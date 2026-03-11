import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type DashboardFeaturePageProps = {
  title: string
  description: string
  icon: LucideIcon
  primaryActionHref?: string
  primaryActionLabel?: string
}

export function DashboardFeaturePage({
  title,
  description,
  icon: Icon,
  primaryActionHref = "/dashboard",
  primaryActionLabel = "Back to Dashboard",
}: DashboardFeaturePageProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="overflow-hidden border-0 shadow-xl">
        <div className="bg-gradient-to-r from-primary/15 via-blue-500/10 to-cyan-500/15 p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 shadow-sm">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>

        <CardHeader>
          <CardTitle>Feature Area</CardTitle>
          <CardDescription>
            This section is now connected from the profile menu, so the card works and lands on a real page.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={primaryActionHref}>{primaryActionLabel}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/resume">Open Resume Builder</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
