import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { companies } from "@/lib/companies"

function tierClass(tier: number) {
  if (tier === 1) return "tier-1"
  if (tier === 2) return "tier-2"
  return "tier-3"
}

export default function CompaniesPage() {
  return (
    <main className="space-y-6">
      <Card className="glass-card border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Companies</CardTitle>
          <CardDescription>
            Open a company page to see company intro, interview rounds, question banks, and prep guidance.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {companies.map((c) => (
            <Link key={c.slug} href={`/company/${c.slug}`} className="block">
              <div className="company-card group cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {c.name}
                      </h3>
                      <Badge className={tierClass(c.tier)}>Tier {c.tier}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {c.roles.map((r) => (
                        <Badge key={r} variant="outline" className="text-xs bg-muted/50">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground mt-1">Open →</div>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </main>
  )
}
