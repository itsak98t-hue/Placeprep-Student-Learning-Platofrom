import Link from "next/link"
import { ArrowRight, Building2 } from "lucide-react"

import { companies } from "@/lib/companies"
import { CompanyCard } from "@/components/company/CompanyCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TrendingCompanies() {
  const tier1 = companies.filter((company) => company.tier === 1).slice(0, 4)
  const tier2 = companies.filter((company) => company.tier === 2).slice(0, 4)
  const tier3 = companies.filter((company) => company.tier === 3).slice(0, 4)

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
            {tier1.map((company) => (
              <CompanyCard key={company.slug} {...company} />
            ))}
          </TabsContent>

          <TabsContent value="tier2" className="space-y-4">
            {tier2.map((company) => (
              <CompanyCard key={company.slug} {...company} />
            ))}
          </TabsContent>

          <TabsContent value="tier3" className="space-y-4">
            {tier3.map((company) => (
              <CompanyCard key={company.slug} {...company} />
            ))}
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
