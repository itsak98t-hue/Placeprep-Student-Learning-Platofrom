import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Building2, TrendingUp, Users, DollarSign, ArrowRight } from "lucide-react"

export default function TrendingCompanies() {
  return (
    <Card className="glass-card border-0 shadow-xl">
      <CardHeader className="text-center pb-6">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 mb-4 mx-auto">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Trending Companies</CardTitle>
        <CardDescription className="text-base">Companies actively hiring with recent placements</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="tier1" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50">
            <TabsTrigger
              value="tier1"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              Tier 1
            </TabsTrigger>
            <TabsTrigger
              value="tier2"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
            >
              Tier 2
            </TabsTrigger>
            <TabsTrigger
              value="tier3"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              Tier 3
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tier1" className="space-y-4">
            <CompanyItem
              name="Google"
              slug="google"
              roles={["Software Engineer", "Product Manager", "Data Scientist"]}
              tier="tier-1"
              openings={12}
              avgSalary="$150-180K"
              growth="+15%"
            />
            <CompanyItem
              name="Microsoft"
              slug="microsoft"
              roles={["Software Engineer", "Cloud Solutions Architect"]}
              tier="tier-1"
              openings={8}
              avgSalary="$140-170K"
              growth="+12%"
            />
            <CompanyItem
              name="Amazon"
              slug="amazon"
              roles={["SDE", "Technical Program Manager", "UX Designer"]}
              tier="tier-1"
              openings={15}
              avgSalary="$135-165K"
              growth="+18%"
            />
            <CompanyItem
              name="Meta"
              slug="meta"
              roles={["Software Engineer", "ML Engineer", "Product Designer"]}
              tier="tier-1"
              openings={6}
              avgSalary="$145-175K"
              growth="+8%"
            />
          </TabsContent>

          <TabsContent value="tier2" className="space-y-4">
            <CompanyItem
              name="Uber"
              slug="uber"
              roles={["Backend Engineer", "Mobile Developer"]}
              tier="tier-2"
              openings={5}
              avgSalary="$120-150K"
              growth="+10%"
            />
            <CompanyItem
              name="Airbnb"
              slug="airbnb"
              roles={["Full Stack Engineer", "Data Engineer"]}
              tier="tier-2"
              openings={4}
              avgSalary="$125-155K"
              growth="+14%"
            />
            <CompanyItem
              name="Salesforce"
              slug="salesforce"
              roles={["Software Engineer", "Solutions Architect"]}
              tier="tier-2"
              openings={7}
              avgSalary="$115-145K"
              growth="+11%"
            />
            <CompanyItem
              name="LinkedIn"
              slug="linkedin"
              roles={["Frontend Engineer", "Backend Engineer"]}
              tier="tier-2"
              openings={3}
              avgSalary="$110-140K"
              growth="+9%"
            />
          </TabsContent>

          <TabsContent value="tier3" className="space-y-4">
            <CompanyItem
              name="Shopify"
              slug="shopify"
              roles={["Developer", "UX Designer"]}
              tier="tier-3"
              openings={6}
              avgSalary="$90-120K"
              growth="+16%"
            />
            <CompanyItem
              name="Atlassian"
              slug="atlassian"
              roles={["Software Engineer", "Product Manager"]}
              tier="tier-3"
              openings={4}
              avgSalary="$95-125K"
              growth="+13%"
            />
            <CompanyItem
              name="Twilio"
              slug="twilio"
              roles={["Software Engineer", "Solutions Engineer"]}
              tier="tier-3"
              openings={3}
              avgSalary="$85-115K"
              growth="+7%"
            />
            <CompanyItem
              name="Dropbox"
              slug="dropbox"
              roles={["Software Engineer", "Product Designer"]}
              tier="tier-3"
              openings={2}
              avgSalary="$100-130K"
              growth="+12%"
            />
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

function CompanyItem({
  name,
  slug,
  roles,
  tier,
  openings,
  avgSalary,
  growth,
}: {
  name: string
  slug: string
  roles: string[]
  tier: string
  openings: number
  avgSalary: string
  growth: string
}) {
  return (
    <Link href={`/company/${slug}`} className="block">
      <div className="company-card group cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{name}</h3>
              <Badge className={tier}>{tier.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {roles.map((role, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-muted/50">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
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
              {avgSalary}
            </div>
            <p className="text-xs text-muted-foreground">Average</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="h-3 w-3" />
              {growth}
            </div>
            <p className="text-xs text-muted-foreground">Growth</p>
          </div>
        </div>
      </div>
    </Link>
  )
}