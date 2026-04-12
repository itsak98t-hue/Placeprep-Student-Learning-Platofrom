"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ResumeInput } from "@/types/resume"

type CreateResumeDialogProps = {
  open: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (values: ResumeInput) => Promise<void>
}

const INITIAL_VALUES: ResumeInput = {
  title: "New Resume",
  targetRole: "Software Developer",
  targetCompany: "",
  template: "ats-default",
}

export function CreateResumeDialog({
  open,
  isSubmitting,
  onOpenChange,
  onCreate,
}: CreateResumeDialogProps) {
  const [values, setValues] = useState<ResumeInput>(INITIAL_VALUES)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setValues(INITIAL_VALUES)
      setError(null)
    }
  }, [open])

  async function handleSubmit() {
    if (!values.title?.trim()) {
      setError("Resume title is required.")
      return
    }

    setError(null)
    await onCreate({
      ...values,
      title: values.title.trim(),
      targetRole: values.targetRole?.trim() || "",
      targetCompany: values.targetCompany?.trim() || "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-border/70 bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new resume</DialogTitle>
          <DialogDescription>
            Start with a clean draft, then tailor it for a specific role or company.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="resume-title">Title</Label>
            <Input
              id="resume-title"
              value={values.title ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
              placeholder="Frontend Resume"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume-role">Target role</Label>
            <Input
              id="resume-role"
              value={values.targetRole ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, targetRole: event.target.value }))}
              placeholder="Software Developer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume-company">Target company</Label>
            <Input
              id="resume-company"
              value={values.targetCompany ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, targetCompany: event.target.value }))}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume-template">Template</Label>
            <Select
              value={values.template ?? "ats-default"}
              onValueChange={(value) => setValues((current) => ({ ...current, template: value }))}
            >
              <SelectTrigger id="resume-template">
                <SelectValue placeholder="Choose template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ats-default">ATS Default</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Resume"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
