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
import type { CodingAttemptStatus, CodingQuestion } from "@/types/coding"

type AttemptFormValues = {
  status: CodingAttemptStatus
  time_spent_min: number
  hints_used: number
  confidence: number
}

type CodingAttemptModalProps = {
  open: boolean
  question: CodingQuestion | null
  initialHintsUsed?: number
  isSubmitting: boolean
  error: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AttemptFormValues) => Promise<void>
}

const DEFAULT_FORM_VALUES: AttemptFormValues = {
  status: "partial",
  time_spent_min: 25,
  hints_used: 0,
  confidence: 3,
}

const STATUS_OPTIONS: Array<{ value: CodingAttemptStatus; label: string }> = [
  { value: "solved", label: "Solved" },
  { value: "partial", label: "Partial" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
]

export function CodingAttemptModal({
  open,
  question,
  initialHintsUsed = 0,
  isSubmitting,
  error,
  onOpenChange,
  onSubmit,
}: CodingAttemptModalProps) {
  const [formValues, setFormValues] = useState<AttemptFormValues>(DEFAULT_FORM_VALUES)

  useEffect(() => {
    if (!open) {
      return
    }

    setFormValues({
      ...DEFAULT_FORM_VALUES,
      hints_used: initialHintsUsed,
    })
  }, [initialHintsUsed, open, question?.question_id])

  async function handleSubmit() {
    await onSubmit(formValues)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border border-border/80 bg-card p-0 shadow-xl sm:max-w-xl">
        <DialogHeader className="border-b border-border/70 bg-muted/10 px-6 pb-5 pt-6">
          <DialogTitle className="text-xl">Update Attempt</DialogTitle>
          <DialogDescription>
            {question
              ? `Record how your attempt went for ${question.title}.`
              : "Record how your coding attempt went."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-6 pt-5">
          {question && (
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="font-medium text-foreground">{question.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {question.platform} - {question.topic.replace(/_/g, " ")} - {question.pattern}
              </p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Solve externally, then log the outcome here so the next recommendation can adapt.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="attempt-status">Status</Label>
            <Select
              value={formValues.status}
              onValueChange={(value) =>
                setFormValues((current) => ({
                  ...current,
                  status: value as CodingAttemptStatus,
                }))
              }
            >
              <SelectTrigger id="attempt-status" className="border-border/70 bg-background/80">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="attempt-time">Time Spent (min)</Label>
              <Input
                id="attempt-time"
                type="number"
                min={0}
                className="border-border/70 bg-background/80"
                value={formValues.time_spent_min}
                placeholder="25"
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    time_spent_min: Number(event.target.value || 0),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attempt-hints">Hints Used</Label>
              <Input
                id="attempt-hints"
                type="number"
                min={0}
                max={4}
                className="border-border/70 bg-background/80"
                value={formValues.hints_used}
                placeholder="0"
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    hints_used: Number(event.target.value || 0),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attempt-confidence">Confidence (1-5)</Label>
              <Select
                value={String(formValues.confidence)}
                onValueChange={(value) =>
                  setFormValues((current) => ({
                    ...current,
                    confidence: Number(value),
                  }))
                }
              >
                <SelectTrigger id="attempt-confidence" className="border-border/70 bg-background/80">
                  <SelectValue placeholder="Confidence" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3 text-xs leading-5 text-muted-foreground">
            PlacePrep does not run code here. Solve on the original platform, then submit the outcome so recommendations and progress stay in sync.
          </div>

          <DialogFooter className="gap-3 border-t border-border/70 pt-5">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={isSubmitting || !question} className="min-w-[136px]">
              {isSubmitting ? "Saving..." : "Submit Attempt"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
