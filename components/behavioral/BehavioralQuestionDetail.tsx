"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft } from "lucide-react"

import { BehavioralEvaluationCard } from "@/components/behavioral/BehavioralEvaluationCard"
import { useAuth } from "@/components/providers/AuthProvider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { BehavioralQuestion } from "@/data/types"
import { useBehavioralProgress } from "@/hooks/use-behavioral-progress"
import { getRecentBehavioralAttempts, saveBehavioralAttempt } from "@/lib/behavioral-attempts"
import { evaluateBehavioralAnswer } from "@/lib/behavioral-evaluation"
import type { BehavioralAttempt, BehavioralPredictResponse, SavedBehavioralAttempt } from "@/types/behavioral"

type BehavioralQuestionDetailProps = {
  question: BehavioralQuestion
}

const MIN_ANSWER_LENGTH = 24
const MAX_HISTORY_ENTRIES = 3
const MAX_SAVED_ATTEMPTS = 5

type EvaluationState = "idle" | "loading" | "success" | "error"
type RetryFocus = "clarity" | "structure" | "impact"
type ResumeAlignmentArea = "specificity" | "quantified_impact" | "ownership_language"

function formatDisplayLabel(label: string | undefined): string {
  if (!label) {
    return "Average"
  }

  return label
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatConfidence(confidence: number | undefined): string {
  if (typeof confidence !== "number") {
    return "0%"
  }

  return `${Math.round(confidence * 100)}%`
}

function formatDelta(value: number): string | null {
  if (value === 0) {
    return null
  }

  return value > 0 ? `+${value}` : `${value}`
}

function getFeedbackPreview(feedback: string | undefined): string {
  const trimmed = feedback?.trim() ?? ""

  if (!trimmed) {
    return "No feedback summary available."
  }

  if (trimmed.length <= 120) {
    return trimmed
  }

  return `${trimmed.slice(0, 117)}...`
}

function toSavedAttempt(
  question: BehavioralQuestion,
  answerText: string,
  result: BehavioralPredictResponse
): SavedBehavioralAttempt {
  const now = new Date().toISOString()

  return {
    id: `local-${Date.now()}-${answerText.length}`,
    userId: "",
    questionId: question.id,
    questionText: question.question,
    answerText: answerText.trim(),
    category: question.category,
    label: result.label,
    display_label: result.display_label,
    confidence: result.confidence,
    score_clarity: result.score_clarity,
    score_structure: result.score_structure,
    score_impact: result.score_impact,
    feedback: result.feedback,
    suggested_improvement: result.suggested_improvement,
    interpretation: result.interpretation,
    missing: Array.isArray(result.missing) ? result.missing : [],
    createdAt: now,
    updatedAt: now,
  }
}

function toBehavioralAttempt(
  question: BehavioralQuestion,
  answerText: string,
  result: BehavioralPredictResponse
): BehavioralAttempt {
  return {
    questionId: question.id,
    questionText: question.question,
    answer: answerText.trim(),
    label: result.label,
    displayLabel: result.display_label,
    confidence: result.confidence,
    scoreClarity: result.score_clarity,
    scoreStructure: result.score_structure,
    scoreImpact: result.score_impact,
    missing: Array.isArray(result.missing) ? result.missing : [],
    feedback: result.feedback,
    suggestedImprovement: result.suggested_improvement,
    interpretation: result.interpretation,
    createdAt: new Date().toISOString(),
    companySlug: question.company,
    category: question.category,
  }
}

function isSameAttempt(
  attempt: SavedBehavioralAttempt,
  answerText: string,
  result: BehavioralPredictResponse
): boolean {
  return (
    attempt.answerText.trim() === answerText.trim() &&
    attempt.label === result.label &&
    attempt.score_clarity === result.score_clarity &&
    attempt.score_structure === result.score_structure &&
    attempt.score_impact === result.score_impact
  )
}

function formatAttemptTimestamp(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "recently"
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function getRetryFocus(result: BehavioralPredictResponse): RetryFocus {
  const scores: Array<[RetryFocus, number]> = [
    ["clarity", result.score_clarity],
    ["structure", result.score_structure],
    ["impact", result.score_impact],
  ]

  return scores.sort((left, right) => left[1] - right[1])[0][0]
}

function getRetryCopy(focus: RetryFocus): {
  title: string
  hint: string
} {
  if (focus === "clarity") {
    return {
      title: "Retry this answer with a clearer opening.",
      hint: "Start with the situation in one direct sentence.",
    }
  }

  if (focus === "structure") {
    return {
      title: "Retry this answer with better structure.",
      hint: "Answer in STAR order.",
    }
  }

  return {
    title: "Retry this answer with stronger impact/results.",
    hint: "Add measurable outcome or result.",
  }
}

function getResumeAlignmentInsight(result: BehavioralPredictResponse): {
  area: ResumeAlignmentArea
  note: string
} | null {
  const missingPoints = Array.isArray(result.missing)
    ? result.missing.map((item) => item.toLowerCase())
    : []
  const hasImpactGap =
    result.score_impact <= 5 ||
    missingPoints.some((item) =>
      item.includes("result") ||
      item.includes("outcome") ||
      item.includes("impact") ||
      item.includes("metric") ||
      item.includes("measurable")
    )

  if (hasImpactGap) {
    return {
      area: "quantified_impact",
      note: "This answer would be stronger with a measurable achievement.",
    }
  }

  const hasOwnershipGap =
    result.label === "weak" ||
    missingPoints.some((item) =>
      item.includes("ownership") ||
      item.includes("your role") ||
      item.includes("personally") ||
      item.includes("action")
    )

  if (hasOwnershipGap) {
    return {
      area: "ownership_language",
      note: "Add clearer ownership of your role.",
    }
  }

  const hasSpecificityGap =
    missingPoints.some((item) =>
      item.includes("specific") ||
      item.includes("detail") ||
      item.includes("example") ||
      item.includes("context")
    ) || result.label !== "strong"

  if (hasSpecificityGap) {
    return {
      area: "specificity",
      note: "Try connecting this answer to a project or internship from your resume.",
    }
  }

  return null
}

export function BehavioralQuestionDetail({ question }: BehavioralQuestionDetailProps) {
  const progress = useBehavioralProgress([question])
  const { user, loading: authLoading } = useAuth()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [draftAnswer, setDraftAnswer] = useState("")
  const [evaluationState, setEvaluationState] = useState<EvaluationState>("idle")
  const [evaluationError, setEvaluationError] = useState<string | null>(null)
  const [evaluationResult, setEvaluationResult] = useState<BehavioralPredictResponse | null>(null)
  const [lastEvaluatedAnswer, setLastEvaluatedAnswer] = useState("")
  const [evaluationHistory, setEvaluationHistory] = useState<SavedBehavioralAttempt[]>([])
  const [savedAttempts, setSavedAttempts] = useState<SavedBehavioralAttempt[]>([])
  const [showPreviousAttempt, setShowPreviousAttempt] = useState(false)
  const [isResultStale, setIsResultStale] = useState(false)

  const trimmedAnswer = draftAnswer.trim()
  const validationMessage =
    !trimmedAnswer
      ? "Add an answer first to run the evaluation."
      : trimmedAnswer.length < MIN_ANSWER_LENGTH
        ? "Please write a slightly longer answer so we can evaluate it properly."
        : null
  const isEvaluating = evaluationState === "loading"
  const isSubmitDisabled = Boolean(validationMessage) || isEvaluating

  const savedPreviousAttempt = useMemo(() => {
    if (!evaluationResult) {
      return savedAttempts[0] ?? null
    }

    return (
      savedAttempts.find((attempt) => !isSameAttempt(attempt, lastEvaluatedAnswer, evaluationResult)) ??
      null
    )
  }, [evaluationResult, lastEvaluatedAnswer, savedAttempts])

  const previousAttempt = evaluationHistory[0] ?? savedPreviousAttempt

  const comparisonSummary =
    evaluationResult && previousAttempt
      ? [
          (() => {
            const delta = formatDelta(evaluationResult.score_clarity - previousAttempt.score_clarity)
            return delta ? `clarity ${delta}` : null
          })(),
          (() => {
            const delta = formatDelta(evaluationResult.score_structure - previousAttempt.score_structure)
            return delta ? `structure ${delta}` : null
          })(),
          (() => {
            const delta = formatDelta(evaluationResult.score_impact - previousAttempt.score_impact)
            return delta ? `impact ${delta}` : null
          })(),
        ]
          .filter((value): value is string => Boolean(value))
          .join(" | ")
      : ""
  const retryFocus = evaluationResult ? getRetryFocus(evaluationResult) : null
  const retryCopy = retryFocus ? getRetryCopy(retryFocus) : null
  const resumeAlignmentInsight = evaluationResult ? getResumeAlignmentInsight(evaluationResult) : null
  const hasImprovedFromPreviousAttempt = evaluationResult && previousAttempt
    ? evaluationResult.score_clarity + evaluationResult.score_structure + evaluationResult.score_impact >
      previousAttempt.score_clarity + previousAttempt.score_structure + previousAttempt.score_impact
    : false

  const savedProgressHint = useMemo(() => {
    if (!savedAttempts.length) {
      return null
    }

    const bestAttempt = savedAttempts.reduce((best, current) => {
      const bestScore = best.score_clarity + best.score_structure + best.score_impact
      const currentScore = current.score_clarity + current.score_structure + current.score_impact
      return currentScore > bestScore ? current : best
    })

    return `Recent saved attempts: ${savedAttempts.length} - Last practiced ${formatAttemptTimestamp(savedAttempts[0].createdAt)} - Best result: ${formatDisplayLabel(bestAttempt.display_label ?? bestAttempt.label)}`
  }, [savedAttempts])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user?.uid) {
      setSavedAttempts([])
      return
    }

    let isActive = true

    void getRecentBehavioralAttempts(user.uid, question.id, MAX_SAVED_ATTEMPTS)
      .then((attempts) => {
        if (isActive) {
          setSavedAttempts(attempts)
        }
      })
      .catch(() => {
        if (isActive) {
          setSavedAttempts([])
        }
      })

    return () => {
      isActive = false
    }
  }, [authLoading, question.id, user?.uid])

  function addToHistory(attempt: SavedBehavioralAttempt) {
    const normalizedAnswer = attempt.answerText.trim()

    if (!normalizedAnswer) {
      return
    }

    setEvaluationHistory((current) => {
      const nextHistory = [
        {
          ...attempt,
          answerText: normalizedAnswer,
        },
        ...current.filter((entry) => entry.answerText.trim() !== normalizedAnswer),
      ]

      return nextHistory.slice(0, MAX_HISTORY_ENTRIES)
    })
  }

  function handleAnswerChange(nextValue: string) {
    setDraftAnswer(nextValue)

    const nextTrimmedAnswer = nextValue.trim()

    if (evaluationResult && lastEvaluatedAnswer && nextTrimmedAnswer !== lastEvaluatedAnswer) {
      addToHistory(toSavedAttempt(question, lastEvaluatedAnswer, evaluationResult))
      setEvaluationResult(null)
      setEvaluationError(null)
      setEvaluationState("idle")
      setIsResultStale(true)
      setShowPreviousAttempt(false)
      return
    }

    if (evaluationError) {
      setEvaluationError(null)
      setEvaluationState("idle")
    }

    if (lastEvaluatedAnswer && nextTrimmedAnswer !== lastEvaluatedAnswer) {
      setIsResultStale(true)
    }
  }

  async function handleEvaluateAnswer() {
    if (isEvaluating) {
      return
    }

    if (validationMessage) {
      setEvaluationState("idle")
      setEvaluationResult(null)
      return
    }

    setEvaluationState("loading")
    setEvaluationError(null)
    setEvaluationResult(null)
    setIsResultStale(false)

    try {
      const result = await evaluateBehavioralAnswer({
        question: question.question,
        answer: trimmedAnswer,
      })

      setEvaluationResult(result)
      setLastEvaluatedAnswer(trimmedAnswer)
      setEvaluationState("success")
      setShowPreviousAttempt(false)
      setIsResultStale(false)

      void saveBehavioralAttempt({
        userId: user?.uid ?? null,
        attempt: toBehavioralAttempt(question, trimmedAnswer, result),
      })
        .then((saveResult) => {
          setSavedAttempts((current) => [saveResult.attempt, ...current].slice(0, MAX_SAVED_ATTEMPTS))
        })
        .catch((saveError) => {
          console.error("Behavioral attempt save skipped after successful evaluation:", saveError)
        })
    } catch (error) {
      const rawMessage =
        error instanceof Error
          ? error.message
          : "We couldn't evaluate your answer right now. Please try again."

      setEvaluationError(rawMessage || "We couldn't evaluate your answer right now. Please try again.")
      setEvaluationResult(null)
      setEvaluationState("error")
    }
  }

  function handleRestorePreviousDraft() {
    if (!previousAttempt) {
      return
    }

    setDraftAnswer(previousAttempt.answerText)
    setEvaluationError(null)
    setEvaluationState("idle")
    setIsResultStale(true)
  }

  function handleTryImprovedVersion() {
    textareaRef.current?.focus()
    setEvaluationError(null)
    setShowPreviousAttempt(false)
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="outline">
        <Link href={question.company === "google" ? "/company/google" : "/company/microsoft"}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {question.company === "google" ? "Google" : "Microsoft"} Behavioral Prep
        </Link>
      </Button>

      <Card className="border shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="tier-1 capitalize">{question.company}</Badge>
                <Badge variant="outline">{question.category}</Badge>
                <Badge variant="outline">Frequency: {question.frequency}</Badge>
                {progress.isPrepared(question.id) && <Badge className="bg-emerald-600 text-white">Prepared</Badge>}
                {progress.isBookmarked(question.id) && <Badge className="bg-sky-600 text-white">Bookmarked</Badge>}
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{question.title}</h1>
              <p className="text-sm text-muted-foreground">{question.sourceLabel}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => progress.togglePrepared(question.id)}>
                {progress.isPrepared(question.id) ? "Unmark Prepared" : "Mark Prepared"}
              </Button>
              <Button variant="outline" onClick={() => progress.toggleBookmarked(question.id)}>
                {progress.isBookmarked(question.id) ? "Remove Bookmark" : "Bookmark"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Behavioral Prompt</CardTitle>
            <CardDescription>Practice this response with a clear STAR-style structure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border bg-muted/20 p-5">
              <p className="text-base leading-7">{question.question}</p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold">Why It Matters</h2>
              <p className="text-sm leading-7 text-muted-foreground">{question.whyItMatters}</p>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="mb-3 text-lg font-semibold">Draft Your Answer</h2>
                {savedProgressHint && (
                  <p className="mb-3 text-xs text-slate-400">{savedProgressHint}</p>
                )}
                <Textarea
                  ref={textareaRef}
                  value={draftAnswer}
                  onChange={(event) => handleAnswerChange(event.target.value)}
                  className="min-h-[260px] border border-slate-800 bg-[#0a1329] text-sm leading-6 text-white placeholder:text-slate-400"
                  placeholder="Write your STAR response here. Focus on the situation, the action you personally took, and the measurable result."
                />
              </div>

              <Button
                type="button"
                onClick={handleEvaluateAnswer}
                disabled={isSubmitDisabled}
                className="w-full border border-slate-800 bg-[#0a1329] text-white transition-all duration-200 hover:bg-[#111d3c] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {isEvaluating ? "Evaluating..." : "Evaluate Answer"}
              </Button>

              {validationMessage && (
                <p className="text-sm text-muted-foreground">{validationMessage}</p>
              )}

              {isEvaluating && (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#0a1329] px-4 py-3 text-sm text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-violet-300 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-violet-300/80 [animation-delay:120ms]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-violet-300/60 [animation-delay:240ms]" />
                  </div>
                  <p>
                    Evaluating your answer...
                    <span className="ml-1 text-slate-400">
                      The first request can take a little longer if the backend is waking up.
                    </span>
                  </p>
                </div>
              )}

              {evaluationError && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
                  <p className="text-sm font-medium text-foreground">Evaluation unavailable</p>
                  <p className="mt-1 text-sm text-muted-foreground">{evaluationError}</p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleEvaluateAnswer}
                      disabled={isSubmitDisabled}
                      className="border-slate-800 bg-[#0a1329] text-white hover:bg-[#111d3c]"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {isResultStale && previousAttempt && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0a1329] px-4 py-3 text-sm">
                  <p className="text-slate-300">Result is based on your previous draft. Evaluate again for fresh feedback.</p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRestorePreviousDraft}
                    className="h-auto px-0 text-xs text-slate-300 hover:bg-transparent hover:text-white"
                  >
                    Restore previous draft
                  </Button>
                </div>
              )}

              {evaluationResult && comparisonSummary && (
                <p className="text-xs text-muted-foreground">
                  Compared with your previous attempt: {comparisonSummary}
                </p>
              )}

              {evaluationResult && <BehavioralEvaluationCard result={evaluationResult} />}

              {resumeAlignmentInsight && (
                <div className="rounded-2xl border border-slate-800 bg-[#0a1329] px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-300">{resumeAlignmentInsight.note}</p>
                    <Button asChild variant="ghost" className="h-auto px-0 text-xs text-slate-300 hover:bg-transparent hover:text-white">
                      <Link href="/dashboard/resume">Open resume builder</Link>
                    </Button>
                  </div>
                </div>
              )}

              {evaluationResult && retryCopy && (
                <div className="rounded-2xl border border-slate-800 bg-[#0a1329] px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-100">{retryCopy.title}</p>
                      <p className="text-xs text-slate-400">{retryCopy.hint}</p>
                      {hasImprovedFromPreviousAttempt && (
                        <p className="text-xs text-emerald-300">Improved from previous attempt.</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleTryImprovedVersion}
                      className="h-auto px-0 text-xs text-slate-300 hover:bg-transparent hover:text-white"
                    >
                      Try improved version
                    </Button>
                  </div>
                </div>
              )}

              {previousAttempt && (
                <div className="rounded-2xl border border-slate-800 bg-[#0a1329] px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-200">Previous attempt available</p>
                      <p className="text-xs text-slate-400">{formatAttemptTimestamp(previousAttempt.createdAt)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowPreviousAttempt((current) => !current)}
                      className="h-auto px-0 text-xs text-slate-300 hover:bg-transparent hover:text-white"
                    >
                      {showPreviousAttempt ? "Hide previous" : "View previous"}
                    </Button>
                  </div>

                  {showPreviousAttempt && (
                    <div className="mt-3 space-y-2 text-sm text-slate-300">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-200">
                          {formatDisplayLabel(previousAttempt.display_label ?? previousAttempt.label)}
                        </span>
                        <span className="text-xs text-slate-400">
                          Confidence {formatConfidence(previousAttempt.confidence)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Clarity {previousAttempt.score_clarity} | Structure {previousAttempt.score_structure} | Impact {previousAttempt.score_impact}
                      </p>
                      <p className="text-sm leading-6 text-slate-300">
                        {getFeedbackPreview(previousAttempt.feedback)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Prep Guidance</CardTitle>
              <CardDescription>Reveal the guidance only when you want it.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="signals">
                  <AccordionTrigger>What Interviewers Look For</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                      {question.whatInterviewerLooksFor.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="tips">
                  <AccordionTrigger>Answer Tips</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                      {question.answerTips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="framework">
                  <AccordionTrigger>STAR Framework</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-7 text-muted-foreground">{question.sampleFramework}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Progress Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button variant="outline" onClick={() => progress.togglePrepared(question.id)}>
                {progress.isPrepared(question.id) ? "Unmark Prepared" : "Mark as Prepared"}
              </Button>
              <Button variant="outline" onClick={() => progress.toggleBookmarked(question.id)}>
                {progress.isBookmarked(question.id) ? "Remove Bookmark" : "Bookmark"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
