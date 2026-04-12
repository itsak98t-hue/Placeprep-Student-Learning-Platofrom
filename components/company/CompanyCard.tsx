import Link from "next/link"
import { DollarSign, TrendingUp, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"

type CompanyCardProps = {
  name: string
  slug: string
  roles: string[]
  tier: number
  openings: number
  salaryRange: string
  growth: number
}

function tierClass(tier: number) {
  if (tier === 1) return "tier-1"
  if (tier === 2) return "tier-2"
  return "tier-3"
}

export function CompanyCard({
  name,
  slug,
  roles,
  tier,
  openings,
  salaryRange,
  growth,
}: CompanyCardProps) {
  return (
    <Link href={`/company/${slug}`} className="block">
      <div className="company-card group cursor-pointer">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold transition-colors group-hover:text-primary">{name}</h3>
              <Badge className={tierClass(tier)}>Tier {tier}</Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {roles.slice(0, 3).map((role) => (
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
              {openings}
            </div>
            <p className="text-xs text-muted-foreground">Openings</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-medium">
              <DollarSign className="h-3 w-3" />
              {salaryRange}
            </div>
            <p className="text-xs text-muted-foreground">Average</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="h-3 w-3" />
              +{growth}%
            </div>
            <p className="text-xs text-muted-foreground">Growth</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
