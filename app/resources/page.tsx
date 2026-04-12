import Link from "next/link"

import resources from "@/data/resources.json"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function ResourcesPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resource Library</p>
        <h1 className="text-3xl font-bold tracking-tight">Learning Resources</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Explore curated DSA, behavioral, resume, and platform resources that plug directly into your prep flow.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.id} className="border shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{resource.category}</Badge>
                <Badge variant="secondary" className="bg-muted/40">
                  {resource.type}
                </Badge>
              </div>
              <CardTitle className="pt-2 text-xl">{resource.title}</CardTitle>
              <CardDescription className="leading-6">{resource.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={`/resources/${resource.id}`}>Open Resource</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
