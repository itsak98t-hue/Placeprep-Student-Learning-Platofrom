"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, ChevronRight, Sparkles } from "lucide-react"

import { CodingHintReveal } from "@/components/coding/CodingHintReveal"
import { CodingSmartHintPanel } from "@/components/coding/CodingSmartHintPanel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { fetchCodingHint, getCodingDifficultyLabel } from "@/lib/coding-recommendation"
import type { CodingQuestion, CodingRecommendationResponse } from "@/types/coding"

type CodingRecommendationBannerProps = {
  currentUserId: string
  recommendation: CodingRecommendationResponse
  onOpenAttempt: (question: CodingQuestion, revealedHints: number) => void
}

function formatTopicLabel(topic: string): string {
  return topic
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function getDifficultyBadgeClassName(difficulty: number): string {
  if (difficulty === 1) {
    return "bg-emerald-600 text-white"
  }

  if (difficulty === 2) {
    return "bg-amber-500 text-white"
  }

  return "bg-rose-600 text-white"
}

function getStepReason(
  direction: "easier" | "harder",
  index: number
): string {
  if (direction === "easier") {
    return index === 0
      ? "This is the closest easier step in the same learning path if you want a slightly gentler version first."
      : "This is a deeper fallback step for rebuilding the same topic more comfortably before moving back up."
  }

  return index === 0
    ? "This is the closest harder step if the main recommendation feels manageable and you want a clean progression."
    : "This is a further stretch step in the same topic path for pushing difficulty a little more."
}

function getActiveReason(
  activeQuestion: CodingQuestion,
  recommendation: CodingRecommendationResponse
): string {
  if (activeQuestion.question_id === recommendation.primary_question.question_id) {
    return recommendation.reason?.trim() || "This question is a strong next step for your current coding practice level."
  }

  const easierIndex = recommendation.easier_questions.findIndex(
    (question) => question.question_id === activeQuestion.question_id
  )
  if (easierIndex >= 0) {
    return getStepReason("easier", easierIndex)
  }

  const harderIndex = recommendation.harder_questions.findIndex(
    (question) => question.question_id === activeQuestion.question_id
  )
  if (harderIndex >= 0) {
    return getStepReason("harder", harderIndex)
  }

  const similarIndex = recommendation.similar_questions.findIndex(
    (question) => question.question_id === activeQuestion.question_id
  )
  if (similarIndex >= 0) {
    return "This is a closely related alternative in the same topic path if you want more repetition without a big difficulty jump."
  }

  return "This question fits into your adaptive coding path based on your recent practice history."
}

export function CodingRecommendationBanner({
  currentUserId,
  recommendation,
  onOpenAttempt,
}: CodingRecommendationBannerProps) {
  const ladderQuestions = useMemo(
    () => [...recommendation.easier_questions].reverse().concat([recommendation.primary_question], recommendation.harder_questions),
    [recommendation]
  )
  const primaryIndex = recommendation.easier_questions.length
  const [activeIndex, setActiveIndex] = useState(primaryIndex)
  const [revealedHints, setRevealedHints] = useState(0)
  const [navigationMessage, setNavigationMessage] = useState<string | null>(null)
  const [smartHint, setSmartHint] = useState<string | null>(null)
  const [smartHintError, setSmartHintError] = useState<string | null>(null)
  const [isSmartHintLoading, setIsSmartHintLoading] = useState(false)

  useEffect(() => {
    setActiveIndex(recommendation.easier_questions.length)
    setRevealedHints(0)
    setNavigationMessage(null)
    setSmartHint(null)
    setSmartHintError(null)
    setIsSmartHintLoading(false)
  }, [recommendation])

  const activeQuestion = ladderQuestions[activeIndex] ?? recommendation.primary_question
  const activeHints = activeQuestion.hint_levels ?? []
  const canRevealHint = revealedHints < activeHints.length
  const shouldShowSmartHintPanel =
    revealedHints > 0 ||
    !canRevealHint ||
    Boolean(smartHint) ||
    isSmartHintLoading ||
    Boolean(smartHintError)
  const activeReason = useMemo(
    () => getActiveReason(activeQuestion, recommendation),
    [activeQuestion, recommendation]
  )

  function moveAlongLadder(direction: "easier" | "harder") {
    const nextIndex = direction === "easier" ? activeIndex - 1 : activeIndex + 1

    if (nextIndex < 0) {
      setNavigationMessage("You are already at the easiest available step in this path.")
      return
    }

    if (nextIndex >= ladderQuestions.length) {
      setNavigationMessage("You are already at the hardest available step in this path.")
      return
    }

    setActiveIndex(nextIndex)
    setRevealedHints(0)
    setNavigationMessage(null)
    setSmartHint(null)
    setSmartHintError(null)
    setIsSmartHintLoading(false)
  }

  function handleRevealHint() {
    if (!canRevealHint) {
      return
    }

    setRevealedHints((current) => current + 1)
    setNavigationMessage(null)
    setSmartHint(null)
    setSmartHintError(null)
  }

  async function handleFetchSmartHint() {
    setNavigationMessage(null)
    setIsSmartHintLoading(true)
    setSmartHintError(null)

    try {
      const response = await fetchCodingHint({
        user_id: currentUserId,
        question_id: activeQuestion.question_id,
        status: "failed",
        hint_level: revealedHints + 1,
      })

      setSmartHint(response.hint)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not fetch AI hint right now."
      setSmartHintError(message)
      setSmartHint(null)
    } finally {
      setIsSmartHintLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-sm">
      <CardHeader className="border-b border-border/70 bg-gradient-to-r from-primary/[0.08] via-muted/10 to-transparent pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI Recommended For You
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {activeIndex === primaryIndex ? "Recommended Next Question" : "Adaptive Path Step"}
                </p>
                <h3 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-[2.2rem]">
                  {activeQuestion.title}
                </h3>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Solve on the original platform and update your progress here.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:max-w-[16rem] lg:justify-end">
            <Badge variant="outline" className="bg-background/80">
              {activeQuestion.platform}
            </Badge>
            <Badge variant="outline" className="bg-background/80">
              {formatTopicLabel(activeQuestion.topic)}
            </Badge>
            <Badge className={getDifficultyBadgeClassName(activeQuestion.difficulty)}>
              {getCodingDifficultyLabel(activeQuestion.difficulty)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] to-background p-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Why this question?</p>
            <p className="text-[11px] text-muted-foreground">Adaptive guidance based on your recent coding pattern</p>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/85">
            {activeReason}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild className="min-w-[140px]">
            <a href={activeQuestion.external_link} target="_blank" rel="noopener noreferrer">
              Solve Question
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </Button>

          <Button variant="outline" onClick={handleRevealHint} disabled={!canRevealHint} className="min-w-[120px]">
            {canRevealHint ? `Show Hint${revealedHints > 0 ? ` ${revealedHints + 1}` : ""}` : "All Hints Shown"}
          </Button>

          <Button variant="outline" onClick={() => moveAlongLadder("easier")} className="min-w-[110px]">
            Try Easier
          </Button>

          <Button variant="outline" onClick={() => moveAlongLadder("harder")} className="min-w-[110px]">
            Try Harder
          </Button>

          <Button variant="outline" onClick={() => onOpenAttempt(activeQuestion, revealedHints)} className="min-w-[130px]">
            Update Attempt
          </Button>
        </div>

        {navigationMessage && (
          <div className="rounded-2xl border border-border/70 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
            {navigationMessage}
          </div>
        )}

        <CodingHintReveal hints={activeHints} revealedCount={revealedHints} />
        <CodingSmartHintPanel
          canRequestHint={shouldShowSmartHintPanel}
          hint={smartHint}
          isLoading={isSmartHintLoading}
          error={smartHintError}
          onRequest={() => void handleFetchSmartHint()}
        />

        <div className="rounded-2xl border border-border/70 bg-muted/10 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">External solve flow</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            PlacePrep tracks your status, hint usage, time spent, and confidence here while you complete the problem on the original platform.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1">Subtopic: {activeQuestion.subtopic}</span>
          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1">Pattern: {activeQuestion.pattern}</span>
          {recommendation.easier_questions.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-3 py-1">
              Easier ladder
              <ChevronRight className="h-3.5 w-3.5" />
              {recommendation.easier_questions.length} step{recommendation.easier_questions.length > 1 ? "s" : ""}
            </span>
          )}
          {recommendation.harder_questions.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-3 py-1">
              Harder ladder
              <ChevronRight className="h-3.5 w-3.5" />
              {recommendation.harder_questions.length} step{recommendation.harder_questions.length > 1 ? "s" : ""}
            </span>
          )}
          {recommendation.similar_questions.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-3 py-1">
              Similar options
              <ChevronRight className="h-3.5 w-3.5" />
              {recommendation.similar_questions.length}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
