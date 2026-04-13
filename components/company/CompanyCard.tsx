"use client"

import Link from "next/link"
import { ArrowRight, DollarSign } from "lucide-react"

import { useCourses } from "@/hooks/useCourses"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

type CompanyCardProps = {
  id: string
  name: string
  difficulty: "easy" | "medium" | "hard"
  avgPackageLPA: number
  requiredCourses: string[]
  focusAreas: string[]
  openRoles: string[]
  tips: string
  readinessScore: number
  logo?: string
}

function getReadinessTone(score: number) {
  if (score >= 90) {
    return {
      label: "Ready to Apply",
      badge: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
      bar: "bg-emerald-500",
    }
  }

  if (score >= 71) {
    return {
      label: "Almost Ready",
      badge: "bg-blue-500/10 text-blue-200 border-blue-500/30",
      bar: "bg-blue-500",
    }
  }

  if (score >= 41) {
    return {
      label: "Getting There",
      badge: "bg-amber-500/10 text-amber-200 border-amber-500/30",
      bar: "bg-amber-500",
    }
  }

  return {
    label: "Not Ready",
    badge: "bg-rose-500/10 text-rose-200 border-rose-500/30",
    bar: "bg-rose-500",
  }
}

export function CompanyCard({
  id,
  name,
  difficulty,
  avgPackageLPA,
  requiredCourses,
  focusAreas,
  openRoles,
  tips,
  readinessScore,
  logo,
}: CompanyCardProps) {
  const { courses } = useCourses()
  const tone = getReadinessTone(readinessScore)
  const courseLabelMap = new Map(courses.map((course) => [course.id, course.label]))

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border bg-muted/20">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-primary">{name.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">{name}</h3>
              <Badge variant="outline" className="capitalize">
                {difficulty}
              </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {openRoles.map((role) => (
                  <Badge key={role} variant="secondary" className="bg-muted/40">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-muted/10 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Avg Package</p>
            <p className="mt-1 flex items-center gap-1 text-lg font-semibold">
              <DollarSign className="h-4 w-4" />
              {avgPackageLPA} LPA
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {requiredCourses.map((courseId) => (
            <Badge key={courseId} variant="outline" className="bg-primary/10 text-primary">
              {courseLabelMap.get(courseId) ?? courseId.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Readiness</p>
              <p className="mt-1 text-2xl font-semibold">{readinessScore}%</p>
            </div>
            <Badge variant="outline" className={tone.badge}>
              {tone.label}
            </Badge>
          </div>
          <Progress value={readinessScore} className="h-2 transition-all duration-700" />
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="leading-6">{tips}</p>
          <div className="flex flex-wrap gap-2">
            {focusAreas.map((area) => (
              <Badge key={area} variant="outline">
                {area}
              </Badge>
            ))}
          </div>
        </div>

        <Button asChild className="justify-between">
          <Link href={`/practice?company=${id}&courses=${requiredCourses.join(",")}`}>
            Start Practicing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
