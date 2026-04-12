"use client"

import { useState } from "react"
import { AlertCircle, Loader2, MessageSquareQuote, Sparkles } from "lucide-react"

import { evaluateBehavioralAnswer } from "@/lib/behavioral-evaluation"
import type { BehavioralQuestion } from "@/data/types"
import type { BehavioralEvaluationResponse } from "@/types/behavioral-evaluation"
import { BehavioralFeedbackCard } from "@/components/behavioral/BehavioralFeedbackCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type BehavioralAnswerEvaluatorProps = {
  question: BehavioralQuestion
}

export function BehavioralAnswerEvaluator({ question }: BehavioralAnswerEvaluatorProps) {
  const [answer, setAnswer] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BehavioralEvaluationResponse | null>(null)

  const trimmedAnswer = answer.trim()
  const isDisabled = !trimmedAnswer || isLoading

  async function handleEvaluate() {
    if (!trimmedAnswer) {
      setError("Please enter your answer before requesting feedback.")
      setResult(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const evaluation = await evaluateBehavioralAnswer({
        question: question.question,
        answer: trimmedAnswer,
      })

      setResult(evaluation)
    } catch (evaluationError) {
      const message =
        evaluationError instanceof Error
          ? evaluationError.message
          : "Could not reach the behavioral evaluation service."

      setError(message)
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/70 shadow-sm backdrop-blur-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <MessageSquareQuote className="h-3.5 w-3.5" />
                Behavioral AI Evaluation
              </div>
              <div>
                <CardTitle className="text-xl">Draft Your Answer</CardTitle>
                <CardDescription className="mt-1 max-w-2xl leading-6">
                  Write a thoughtful STAR-style response, then send it to the internal Groq-powered evaluator for feedback.
                </CardDescription>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Prompt Focus</p>
              <p className="mt-1 line-clamp-3 max-w-md leading-6">{question.question}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            className="min-h-[260px] border-border/70 bg-background/60 text-sm leading-7 shadow-inner"
            placeholder="Write your answer here. Cover the situation, what you personally did, and the result."
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleEvaluate} disabled={isDisabled} className="min-w-[170px]">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Evaluate Answer
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                {trimmedAnswer
                  ? "Your answer will be sent to the internal /api/evaluate route for scoring."
                  : "Add your answer first to enable evaluation."}
              </p>
            </div>

            <div className="rounded-full border border-border/60 bg-background/50 px-3 py-1.5 text-xs text-muted-foreground">
              {trimmedAnswer ? `${trimmedAnswer.split(/\s+/).length} words` : "0 words"}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="border-border/70 bg-card/70 shadow-sm">
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="font-medium text-foreground">Running behavioral evaluation</p>
              <p className="text-sm text-muted-foreground">
                The AI evaluator is reviewing your answer for clarity, structure, and impact.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-rose-500/30 bg-rose-500/5 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertCircle className="h-4 w-4" />
              <CardTitle className="text-base">Evaluation Unavailable</CardTitle>
            </div>
            <CardDescription className="leading-6">
              The internal evaluation route could not complete your request. Check your deployed environment variables and Groq server key.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && <BehavioralFeedbackCard result={result} />}
    </div>
  )
}
