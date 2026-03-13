import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { CompanyPrepContent } from "@/components/company/CompanyPrepContent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { companyDetailsBySlug, supportedCompanySlugs } from "@/lib/company-details"

export function generateStaticParams() {
  return supportedCompanySlugs.map((slug) => ({ slug }))
}

function tierClass(tier: number) {
  if (tier === 1) return "tier-1"
  if (tier === 2) return "tier-2"
  return "tier-3"
}

export default function CompanyPage({ params }: { params: { slug: string } }) {
  const company = companyDetailsBySlug[params.slug]

  if (!company) {
    return notFound()
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border bg-card shadow-xl">
        <div className="bg-gradient-to-r from-primary/15 via-blue-500/10 to-cyan-500/15 p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={tierClass(company.tier)}>Tier {company.tier}</Badge>
                <Badge variant="outline" className="bg-background/70">
                  {company.difficulty}
                </Badge>
                <Badge variant="outline" className="bg-background/70">
                  Updated {company.lastUpdated}
                </Badge>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight">{company.name}</h1>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground">{company.intro}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {company.roles.map((role) => (
                  <Badge key={role} variant="outline" className="bg-background/70">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/companies">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Companies
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/resume">Prepare Resume</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t bg-background/70 p-6 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Openings" value={String(company.openings)} />
          <StatsCard label="Salary Range" value={company.salaryRange} />
          <StatsCard label="Growth" value={`+${company.growth}%`} />
          <StatsCard label="Location" value={company.location} />
        </div>
      </section>

      <CompanyPrepContent company={company} companySlug={params.slug} />
    </main>
  )
}

function StatsCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}
