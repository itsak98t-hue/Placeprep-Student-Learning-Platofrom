"use client"

import { Suspense } from "react"

import { ResumeManager } from "@/components/resume/ResumeManager"

export default function ResumePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">Loading resume manager...</div>}>
      <ResumeManager />
    </Suspense>
  )
}
