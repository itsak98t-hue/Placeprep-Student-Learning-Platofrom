import Link from "next/link"
import { notFound } from "next/navigation"

import resources from "@/data/resources.json"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function generateStaticParams() {
  return resources.map((resource) => ({ id: resource.id }))
}

export default function ResourceDetail({ params }: { params: { id: string } }) {
  const resource = resources.find((item) => item.id === params.id)

  if (!resource) {
    return notFound()
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="outline">
        <Link href="/resources">Back to resources</Link>
      </Button>

      <Card className="border shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{resource.category}</Badge>
            <Badge variant="secondary" className="bg-muted/40">
              {resource.type}
            </Badge>
          </div>
          <CardTitle className="text-3xl tracking-tight">{resource.title}</CardTitle>
          <CardDescription className="max-w-2xl leading-7">
            {resource.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">
            This resource is part of the new data-driven resource system so the dashboard, company pages, and practice flows can all point to the same source of truth.
          </p>
          <Button asChild>
            <Link href={resource.href}>Open Resource</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
