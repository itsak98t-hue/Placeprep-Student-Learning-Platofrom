"use client"

import Link from "next/link"
import { ArrowRight, Building2 } from "lucide-react"

import { useCompanies } from "@/hooks/useCompanies"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function TrendingCompanies() {
  const { companies, loading } = useCompanies()
  const topCompanies = companies.slice(0, 5)

  return (
    <Card className="glass-card border-0 shadow-xl">
      <CardHeader className="pb-6 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 p-3">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Trending Companies</CardTitle>
        <CardDescription className="text-base">
          Top companies from your Firestore catalog. Add one more document and it appears here automatically.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-28 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {topCompanies.map((company) => (
              <Link
                key={company.id}
                href={`/company/${company.id}`}
                className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/10"
              >
                {company.name}
                <span className="ml-2 rounded-full bg-background/80 px-2 py-0.5 text-xs text-muted-foreground">
                  {company.difficulty}
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-border/70 bg-muted/10 p-4 text-sm text-muted-foreground">
          Browse company-specific preparation tracks with readiness scores, required courses, and role-focused guidance.
        </div>

        <div className="text-center">
          <Link href="/companies">
            <Button className="glow-button group">
              View All Companies
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
