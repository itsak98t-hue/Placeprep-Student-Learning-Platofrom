"use client"

import type { FormEvent } from "react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { CodingAttemptStatus } from "@/types/coding"

type AttemptSubmissionValues = {
  status: CodingAttemptStatus
  time_spent_min: number
  hints_used: number
  confidence: number
}

type AttemptSubmissionFormProps = {
  questionId: string
  isSubmitting: boolean
  error: string | null
  successMessage: string | null
  onSubmit: (values: AttemptSubmissionValues) => Promise<void>
}

const STATUS_OPTIONS: { value: CodingAttemptStatus; label: string }[] = [
  { value: "solved", label: "Solved" },
  { value: "partial", label: "Partially Solved" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
]

const DEFAULT_FORM_STATE: AttemptSubmissionValues = {
  status: "solved",
  time_spent_min: 25,
  hints_used: 0,
  confidence: 3,
}

export function AttemptSubmissionForm({
  questionId,
  isSubmitting,
  error,
  successMessage,
  onSubmit,
}: AttemptSubmissionFormProps) {
  const [formState, setFormState] = useState<AttemptSubmissionValues>(DEFAULT_FORM_STATE)

  useEffect(() => {
    setFormState(DEFAULT_FORM_STATE)
  }, [questionId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(formState)
    setFormState(DEFAULT_FORM_STATE)
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Record Your Attempt</CardTitle>
        <CardDescription>
          Solve this question externally, then log how the attempt went so PlacePrep can recommend the next best question.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <Label>Result</Label>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {STATUS_OPTIONS.map((option) => {
                const isActive = formState.status === option.value

                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    className={cn("justify-center", isActive && "shadow-sm")}
                    onClick={() => setFormState((current) => ({ ...current, status: option.value }))}
                  >
                    {option.label}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="time_spent_min">Time Spent (minutes)</Label>
              <Input
                id="time_spent_min"
                type="number"
                min={0}
                value={formState.time_spent_min}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    time_spent_min: Number(event.target.value || 0),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hints_used">Hints Used</Label>
              <Input
                id="hints_used"
                type="number"
                min={0}
                max={4}
                value={formState.hints_used}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    hints_used: Number(event.target.value || 0),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidence">Confidence Level</Label>
              <Select
                value={String(formState.confidence)}
                onValueChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    confidence: Number(value),
                  }))
                }
              >
                <SelectTrigger id="confidence">
                  <SelectValue placeholder="Select confidence" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value} / 5
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

          {successMessage && (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-4 text-sm text-green-700 dark:text-green-300">
              {successMessage}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Saving Progress..." : "Save Attempt & Fetch Next Recommendation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
