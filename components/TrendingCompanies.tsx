"use client"

import Link from "next/link"
import { ArrowRight, Building2 } from "lucide-react"

import { CompanyCard } from "@/components/company/CompanyCard"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCompanies } from "@/hooks/useCompanies"
import { useUserAnalytics } from "@/hooks/useUserAnalytics"

export default function TrendingCompanies() {
  const { user } = useAuth()
  const { answers } = useUserAnalytics(user?.uid)
  const { companies, loading } = useCompanies(answers)
  const tier1 = companies.filter((company) => company.difficulty === "hard").slice(0, 4)
  const tier2 = companies.filter((company) => company.difficulty === "medium").slice(0, 4)
  const tier3 = companies.filter((company) => company.difficulty === "easy").slice(0, 4)

  return (
    <Card className="glass-card border-0 shadow-xl">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto mb-4 inline-flex rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 p-3">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Trending Companies</CardTitle>
        <CardDescription className="text-base">A data-driven company catalog with interview prep routes for all listed companies.</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="tier1" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger value="tier1">Tier 1</TabsTrigger>
            <TabsTrigger value="tier2">Tier 2</TabsTrigger>
            <TabsTrigger value="tier3">Tier 3</TabsTrigger>
          </TabsList>

          <TabsContent value="tier1" className="space-y-4">
            {loading ? <TrendingSkeleton /> : tier1.map((company) => <CompanyCard key={company.id} {...company} />)}
          </TabsContent>

          <TabsContent value="tier2" className="space-y-4">
            {loading ? <TrendingSkeleton /> : tier2.map((company) => <CompanyCard key={company.id} {...company} />)}
          </TabsContent>

          <TabsContent value="tier3" className="space-y-4">
            {loading ? <TrendingSkeleton /> : tier3.map((company) => <CompanyCard key={company.id} {...company} />)}
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
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

function TrendingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border/70 bg-card p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-3 h-4 w-56" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
