"use client"

import { CompanyCard } from "@/components/company/CompanyCard"
import { EmptyState } from "@/components/EmptyState"
import { SkeletonCompanyCard } from "@/components/SkeletonCompanyCard"
import { useAuth } from "@/components/providers/AuthProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCompanies } from "@/hooks/useCompanies"
import { useUserAnalytics } from "@/hooks/useUserAnalytics"

export default function CompaniesPage() {
  const { user } = useAuth()
  const { answers, analytics, loading: analyticsLoading } = useUserAnalytics(user?.uid)
  const { companies, loading: companiesLoading } = useCompanies(answers)

  const loading = analyticsLoading || companiesLoading
  const hasPractice = analytics.topicsCovered > 0

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Card className="glass-card border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Companies</CardTitle>
          <CardDescription>
            Every company card is rendered from Firestore and computes your readiness from live answer history.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCompanyCard key={index} />
              ))}
            </div>
          ) : !hasPractice ? (
            <EmptyState
              title="Complete some practice to see your readiness score."
              description="We only compute company readiness from real answers. Once you start practicing, the score for each company will update automatically."
              ctaLabel="Go to Practice"
              href="/practice"
            />
          ) : companies.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {companies.map((company) => (
                <CompanyCard key={company.id} {...company} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No companies available yet."
              description="Add a company document in Firestore and it will appear here automatically."
              ctaLabel="Open Dashboard"
              href="/dashboard"
            />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
