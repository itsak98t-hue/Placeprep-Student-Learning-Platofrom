import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Company = {
  name: string
  slug: string
  tier: 1 | 2 | 3
  roles: string[]
}

const companies: Company[] = [
  { name: "Google", slug: "google", tier: 1, roles: ["Software Engineer", "Product Manager", "Data Scientist"] },
  { name: "Microsoft", slug: "microsoft", tier: 1, roles: ["Software Engineer", "Cloud Solutions Architect"] },
  { name: "Amazon", slug: "amazon", tier: 1, roles: ["SDE", "Technical Program Manager", "UX Designer"] },
  { name: "Meta", slug: "meta", tier: 1, roles: ["Software Engineer", "ML Engineer", "Product Designer"] },

  { name: "Uber", slug: "uber", tier: 2, roles: ["Backend Engineer", "Mobile Developer"] },
  { name: "Airbnb", slug: "airbnb", tier: 2, roles: ["Full Stack Engineer", "Data Engineer"] },
  { name: "Salesforce", slug: "salesforce", tier: 2, roles: ["Software Engineer", "Solutions Architect"] },
  { name: "LinkedIn", slug: "linkedin", tier: 2, roles: ["Frontend Engineer", "Backend Engineer"] },

  { name: "Shopify", slug: "shopify", tier: 3, roles: ["Developer", "UX Designer"] },
  { name: "Atlassian", slug: "atlassian", tier: 3, roles: ["Software Engineer", "Product Manager"] },
  { name: "Twilio", slug: "twilio", tier: 3, roles: ["Software Engineer", "Solutions Engineer"] },
  { name: "Dropbox", slug: "dropbox", tier: 3, roles: ["Software Engineer", "Product Designer"] },
]

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
          <CardDescription>Open a company page to see prep details, questions, and trends.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {companies.map((c) => (
            <Link key={c.slug} href={`/companies/${c.slug}`} className="block">
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