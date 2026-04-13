export function SkeletonCompanyCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border p-5">
      <div className="mb-3 h-4 w-1/4 rounded bg-muted" />
      <div className="mb-3 h-3 w-1/3 rounded bg-muted" />
      <div className="mb-4 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-muted" />
        <div className="h-6 w-16 rounded-full bg-muted" />
        <div className="h-6 w-16 rounded-full bg-muted" />
      </div>
      <div className="mb-2 h-2 w-full rounded bg-muted" />
      <div className="h-2 w-2/3 rounded bg-muted" />
    </div>
  )
}

