"use client"

import { useEffect, useState } from "react"

import { getRecentBehavioralAttempts, saveBehavioralAttempt } from "@/lib/behavioral-attempts"
import { evaluateBehavioralAnswer } from "@/lib/behavioral-evaluation"
import type { BehavioralQuestion } from "@/data/types"
import type { BehavioralAttempt, SaveAttemptResult } from "@/types/behavioral"
import type { BehavioralEvaluationResponse } from "@/types/behavioral-evaluation"
import { AIFeedbackCard } from "@/components/AIFeedbackCard"
import { BehavioralFeedbackCard } from "@/components/behavioral/BehavioralFeedbackCard"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/providers/AuthProvider"

type BehavioralPrepDialogProps = {
  open: boolean
  question: BehavioralQuestion | null
  onOpenChange: (open: boolean) => void
}

type SaveState = "idle" | "saving" | "cloud" | "local"

export function BehavioralPrepDialog({
  open,
  question,
  onOpenChange,
}: BehavioralPrepDialogProps) {
  const { user } = useAuth()
  const [answer, setAnswer] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BehavioralEvaluationResponse | null>(null)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [recentAttempts, setRecentAttempts] = useState<BehavioralAttempt[]>([])

  const trimmedAnswer = answer.trim()
  const answerWordCount = trimmedAnswer ? trimmedAnswer.split(/\s+/).length : 0
  const isAnswerTooShort = answerWordCount > 0 && answerWordCount < 12
  const isSubmitDisabled = !question || !trimmedAnswer || isAnswerTooShort || isEvaluating || saveState === "saving"

  useEffect(() => {
    if (!open) {
      setAnswer("")
      setError(null)
      setSaveState("idle")
      setSaveMessage(null)
      setResult(null)
      setIsEvaluating(false)
      setRecentAttempts([])
      return
    }

    setAnswer("")
    setError(null)
    setSaveState("idle")
    setSaveMessage(null)
    setResult(null)
    if (user?.uid && question?.id) {
      void getRecentBehavioralAttempts(user.uid, question.id, 3).then((attempts) => {
        setRecentAttempts(
          attempts.map((attempt) => ({
            questionId: attempt.questionId,
            questionText: attempt.questionText,
            answer: attempt.answerText,
            label: attempt.label,
            displayLabel: attempt.display_label,
            confidence: attempt.confidence,
            scoreClarity: attempt.score_clarity,
            scoreStructure: attempt.score_structure,
            scoreImpact: attempt.score_impact,
            missing: attempt.missing,
            feedback: attempt.feedback,
            suggestedImprovement: attempt.suggested_improvement,
            interpretation: attempt.interpretation,
            createdAt: attempt.createdAt,
            category: attempt.category,
          }))
        )
      })
    }
  }, [open, question?.id, user?.uid])

  function buildBehavioralAttempt(
    nextQuestion: BehavioralQuestion,
    answerText: string,
    evaluation: BehavioralEvaluationResponse
  ): BehavioralAttempt {
    return {
      questionId: nextQuestion.id,
      questionText: nextQuestion.question,
      answer: answerText,
      label: evaluation.label,
      displayLabel: evaluation.display_label,
      confidence: evaluation.confidence,
      scoreClarity: evaluation.score_clarity,
      scoreStructure: evaluation.score_structure,
      scoreImpact: evaluation.score_impact,
      missing: evaluation.missing,
      feedback: evaluation.feedback,
      suggestedImprovement: evaluation.suggested_improvement,
      interpretation: evaluation.interpretation,
      createdAt: new Date().toISOString(),
      companySlug: nextQuestion.company,
      category: nextQuestion.category,
    }
  }

  async function handleSubmit() {
    if (!question || isEvaluating) {
      return
    }

    if (!trimmedAnswer) {
      setError("Please enter your answer before requesting feedback.")
      setSaveState("idle")
      setSaveMessage(null)
      setResult(null)
      return
    }

    if (isAnswerTooShort) {
      setError("Please write a slightly fuller answer so the evaluator has enough context to score it.")
      setSaveState("idle")
      setSaveMessage(null)
      setResult(null)
      return
    }

    setIsEvaluating(true)
    setError(null)
    setSaveState("idle")
    setSaveMessage(null)
    setResult(null)

    try {
      const evaluation = await evaluateBehavioralAnswer({
        question: question.question,
        answer: trimmedAnswer,
      })

      setResult(evaluation)
      setSaveState("saving")
      setSaveMessage("Saving...")

      const saveResult: SaveAttemptResult = await saveBehavioralAttempt({
        userId: user?.uid ?? null,
        attempt: buildBehavioralAttempt(question, trimmedAnswer, evaluation),
      })

      if (saveResult.status === "cloud") {
        setSaveState("cloud")
        setSaveMessage("Attempt saved")
      } else {
        setSaveState("local")
        setSaveMessage("Saved locally. Cloud sync unavailable right now.")
      }
    } catch (evaluationError) {
      const message =
        evaluationError instanceof Error
          ? evaluationError.message
          : "We couldn't evaluate this answer right now. Please try again."

      setError(message)
      setSaveState("idle")
      setSaveMessage(null)
      setResult(null)
    } finally {
      setIsEvaluating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0 flex flex-col">
        <DialogHeader className="sticky top-0 z-10 shrink-0 space-y-3 border-b bg-background/95 px-6 py-5 pr-12 text-left backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <DialogTitle>{question?.title ?? "Behavioral Prep"}</DialogTitle>
          <DialogDescription>
            Practice your answer and get ML feedback without leaving the question bank.
          </DialogDescription>
        </DialogHeader>

        {question && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-sm font-medium text-muted-foreground">Selected Question</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{question.question}</p>
                </div>

                <div className="space-y-3">
                  <Textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    className="min-h-[220px] text-sm leading-6"
                    placeholder="Write your STAR response here. Focus on the situation, your action, and the result."
                  />

                  {trimmedAnswer && isAnswerTooShort && !isEvaluating && (
                    <p className="text-sm text-muted-foreground">Write at least a few more words before evaluating.</p>
                  )}
                </div>

                {error && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
                    <p className="text-sm font-medium text-foreground">Evaluation unavailable</p>
                    <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                  </div>
                )}

                {saveMessage && (
                  <div className={`rounded-2xl p-4 ${
                    saveState === "cloud"
                      ? "border border-emerald-500/30 bg-emerald-500/5"
                      : saveState === "local"
                        ? "border border-amber-500/30 bg-amber-500/5"
                        : "border bg-muted/20"
                  }`}>
                    <p className="text-sm font-medium text-foreground">
                      {saveState === "saving"
                        ? "Saving attempt"
                        : saveState === "local"
                          ? "Saved locally"
                          : "Attempt saved"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{saveMessage}</p>
                  </div>
                )}

                {result && (
                  <div className="space-y-4">
                    <AIFeedbackCard
                      score={Math.round((result.score_clarity + result.score_structure + result.score_impact) / 3)}
                      feedback={{
                        strengths: result.score_clarity >= 7 ? ["Your answer is easy to follow."] : [],
                        improvements: result.missing,
                        suggestions: result.suggested_improvement ? [result.suggested_improvement] : [],
                        ratingExplanation: result.interpretation || result.feedback,
                      }}
                    />
                    <BehavioralFeedbackCard result={result} compact />
                  </div>
                )}

                {recentAttempts.length > 0 && (
                  <div className="rounded-2xl border bg-muted/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">View Feedback History</p>
                      <p className="text-xs text-muted-foreground">Last {recentAttempts.length} attempts</p>
                    </div>
                    <div className="mt-3 space-y-3">
                      {recentAttempts.map((attempt) => (
                        <div key={attempt.createdAt} className="rounded-xl border bg-background/60 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                              {new Date(attempt.createdAt).toLocaleString()}
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              Score {Math.round((attempt.scoreClarity + attempt.scoreStructure + attempt.scoreImpact) / 3)}/10
                            </p>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{attempt.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
                  {isEvaluating
                    ? "Evaluating..."
                    : result
                      ? "Re-evaluate Answer"
                      : "Submit Answer"}
                </Button>
                {!trimmedAnswer && (
                  <p className="text-sm text-muted-foreground">Add an answer first to run the evaluation.</p>
                )}
                {isEvaluating && (
                  <p className="text-sm text-muted-foreground">
                    Getting feedback from the ML service. The first request can take a little longer if the backend is waking up.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
