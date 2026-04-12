import { CompanyCard } from "@/components/company/CompanyCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { companies } from "@/lib/companies"

export default function CompaniesPage() {
  return (
    <main className="space-y-6">
      <Card className="glass-card border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Companies</CardTitle>
          <CardDescription>
            Open a company page to see real company metadata, question banks, and prep guidance from the shared dataset.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {companies.map((company) => (
            <CompanyCard key={company.slug} {...company} />
          ))}
        </CardContent>
      </Card>
    </main>
  )
}
