export function SkeletonCourseCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border p-5">
      <div className="mb-3 h-4 w-1/3 rounded bg-muted" />
      <div className="mb-4 h-3 w-1/4 rounded bg-muted" />
      <div className="mb-2 h-2 w-full rounded bg-muted" />
      <div className="h-2 w-3/4 rounded bg-muted" />
    </div>
  )
}

