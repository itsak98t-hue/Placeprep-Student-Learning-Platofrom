import Link from "next/link"

import { Button } from "@/components/ui/button"

export function EmptyState({
  title,
  description,
  ctaLabel,
  href,
}: {
  title: string
  description: string
  ctaLabel: string
  href: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-8 text-center">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mt-4">
        <Button asChild>
          <Link href={href}>{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  )
}

