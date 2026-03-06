import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import InterviewExperienceForm from "@/components/InterviewExperienceForm"

const COMPANY_DATA: Record<
  string,
  {
    name: string
    tier: "tier-1" | "tier-2" | "tier-3"
    roles: string[]
    openings: number
    avgSalary: string
    growth: string
    description: string
    interviewProcess: string[]
    topQuestions: string[]
  }
> = {
  google: {
    name: "Google",
    tier: "tier-1",
    roles: ["Software Engineer", "Product Manager", "Data Scientist"],
    openings: 12,
    avgSalary: "$150-180K",
    growth: "+15%",
    description: "Google hires across software, product, cloud, data, and AI roles.",
    interviewProcess: [
      "Online Assessment (sometimes)",
      "2–3 DSA rounds (arrays, graphs, DP patterns)",
      "Googlyness + behavioral",
      "Role fit / team match (varies)",
    ],
    topQuestions: [
      "Two Sum / Variants",
      "Binary Search on Answer",
      "Graph traversal (BFS/DFS)",
      "Intervals + Sorting patterns",
    ],
  },
  microsoft: {
    name: "Microsoft",
    tier: "tier-1",
    roles: ["Software Engineer", "Cloud Solutions Architect"],
    openings: 8,
    avgSalary: "$140-170K",
    growth: "+12%",
    description: "Microsoft roles often focus on software, cloud, enterprise systems, and AI.",
    interviewProcess: ["Online Assessment", "2–3 coding rounds", "Behavioral / hiring manager"],
    topQuestions: ["Strings", "HashMap", "Trees", "Dynamic Programming basics"],
  },
  amazon: {
    name: "Amazon",
    tier: "tier-1",
    roles: ["SDE", "Technical Program Manager", "UX Designer"],
    openings: 15,
    avgSalary: "$135-165K",
    growth: "+18%",
    description: "Amazon hires heavily for engineering, operations tech, cloud, and product teams.",
    interviewProcess: ["Online Assessment", "Coding rounds", "System design (for experienced)", "Leadership Principles"],
    topQuestions: ["Arrays + Hashing", "Stacks/Queues", "Graphs", "LL / Trees"],
  },
}

export function generateStaticParams() {
  return [{ slug: "google" }, { slug: "amazon" }, { slug: "microsoft" }]
}

export default function CompanyPage({ params }: { params: { slug: string } }) {
  const company = COMPANY_DATA[params.slug]

  if (!company) return notFound()

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{company.name}</h1>
            <Badge className={company.tier}>
              {company.tier.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground max-w-2xl">{company.description}</p>

          <div className="flex flex-wrap gap-2">
            {company.roles.map((r) => (
              <Badge key={r} variant="outline" className="bg-muted/50">
                {r}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>
              <b className="text-foreground">Openings:</b> {company.openings}
            </span>
            <span>
              <b className="text-foreground">Average Salary:</b> {company.avgSalary}
            </span>
            <span>
              <b className="text-foreground">Growth:</b> {company.growth}
            </span>
          </div>
        </div>

        <Button asChild variant="outline">
          <Link href="/companies">Back</Link>
        </Button>
      </div>

      <Card className="glass-card border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">Company Prep</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="interview">Interview</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="rounded-xl border p-4 space-y-2">
                <div className="font-semibold">About {company.name}</div>
                <p className="text-sm text-muted-foreground">{company.description}</p>
              </div>

              <div className="rounded-xl border p-4 space-y-2">
                <div className="font-semibold">Recommended focus areas</div>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>DSA patterns + problem solving speed</li>
                  <li>Core CS: OS, DBMS, Networking</li>
                  <li>Behavioral round preparation</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="interview" className="space-y-6">
              <div className="rounded-xl border p-4 space-y-2">
                <div className="font-semibold">Typical interview flow</div>
                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                  {company.interviewProcess.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>

              <InterviewExperienceForm companySlug={params.slug} />
            </TabsContent>

            <TabsContent value="questions" className="space-y-3">
              <div className="rounded-xl border p-4 space-y-2">
                <div className="font-semibold">Commonly asked topics / questions</div>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {company.topQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="jobs" className="space-y-3">
              <div className="rounded-xl border p-4 space-y-2">
                <div className="font-semibold">Key stats</div>
                <p className="text-sm text-muted-foreground">Openings: {company.openings}</p>
                <p className="text-sm text-muted-foreground">Average salary: {company.avgSalary}</p>
                <p className="text-sm text-muted-foreground">Growth: {company.growth}</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}