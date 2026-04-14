"use client"

import Link from "next/link"
import { DollarSign, TrendingUp, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"

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

function tierClass(tier: number) {
  if (tier === 1) return "tier-1"
  if (tier === 2) return "tier-2"
  return "tier-3"
}

function difficultyToTier(difficulty: CompanyCardProps["difficulty"]) {
  if (difficulty === "hard") return 1
  if (difficulty === "medium") return 2
  return 3
}

export function CompanyCard({
  id,
  name,
  difficulty,
  avgPackageLPA,
  openRoles,
  readinessScore,
}: CompanyCardProps) {
  const tier = difficultyToTier(difficulty)

  return (
    <Link href={`/company/${id}`} className="block">
      <div className="company-card group cursor-pointer">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold transition-colors group-hover:text-primary">{name}</h3>
              <Badge className={tierClass(tier)}>Tier {tier}</Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {openRoles.slice(0, 3).map((role) => (
                <Badge key={role} variant="outline" className="bg-muted/50 text-xs">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border/50 pt-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-medium">
              <Users className="h-3 w-3" />
              {openRoles.length}
            </div>
            <p className="text-xs text-muted-foreground">Openings</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-medium">
              <DollarSign className="h-3 w-3" />
              {avgPackageLPA} LPA
            </div>
            <p className="text-xs text-muted-foreground">Average</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="h-3 w-3" />
              +{Math.max(0, Math.round(readinessScore))}%
            </div>
            <p className="text-xs text-muted-foreground">Growth</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
