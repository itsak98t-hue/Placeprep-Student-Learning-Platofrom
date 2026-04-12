"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, ChevronRight, RotateCcw } from "lucide-react"

import { CodingAnswerHistoryCard } from "@/components/coding/CodingAnswerHistoryCard"
import { useAuth } from "@/components/providers/AuthProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  companies,
  getCompanyById,
  getQuestionsByCompany,
} from "@/data/companies"
import type { CompanySlug } from "@/data/types"
import {
  getAdaptiveCodingQuestions,
  getAdaptiveDifficulty,
  getTopicLabel,
  pickNextAdaptiveQuestion,
  type AdaptiveCodingQuestion,
} from "@/data/coding-question-pool"
import { getAnswers, saveAnswer } from "@/lib/firestore/userDataService"
import type { UserAnswer } from "@/types/answers"

const DEMO_CODING_USER_ID = "u1"

function formatDifficultyLabel(difficulty: AdaptiveCodingQuestion["difficulty"]) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

function getDifficultyBadgeClassName(difficulty: AdaptiveCodingQuestion["difficulty"]) {
  if (difficulty === "easy") {
    return "bg-emerald-600 text-white"
  }

  if (difficulty === "medium") {
    return "bg-amber-500 text-black"
  }

  return "bg-rose-600 text-white"
}

function getAdaptiveRating(isCorrect: boolean, difficulty: AdaptiveCodingQuestion["difficulty"]) {
  if (isCorrect && difficulty === "hard") {
    return 10
  }

  if (isCorrect && difficulty === "medium") {
    return 8
  }

  if (isCorrect) {
    return 7
  }

  if (difficulty === "hard") {
    return 3
  }

  if (difficulty === "medium") {
    return 4
  }

  return 5
}

function getOutcomeFeedback(isCorrect: boolean, question: AdaptiveCodingQuestion) {
  if (isCorrect) {
    return `Marked solved. The next question will lean ${question.difficulty === "hard" ? "toward more hard practice" : "slightly tougher if you keep the streak going"}.`
  }

  return "Marked wrong. The adaptive loop will ease off when needed so you can rebuild momentum."
}

function getQuestionSummary(question: AdaptiveCodingQuestion, isCorrect: boolean, userScore: number) {
  return `Outcome: ${isCorrect ? "solved" : "wrong"}. Difficulty: ${question.difficulty}. Topic: ${question.topic}. Adaptive score after this attempt: ${userScore}.`
}

export default function PracticePage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id ?? "google")
  const [difficultyFilter, setDifficultyFilter] = useState<AdaptiveCodingQuestion["difficulty"] | "all">("all")
  const [userScore, setUserScore] = useState(0)
  const [seenQuestionIds, setSeenQuestionIds] = useState<string[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveCodingQuestion | null>(null)
  const [savedAnswers, setSavedAnswers] = useState<UserAnswer[]>([])
  const [isAnswersLoading, setIsAnswersLoading] = useState(true)
  const [answersError, setAnswersError] = useState<string | null>(null)
  const [isSavingAnswer, setIsSavingAnswer] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { user, loading: authLoading } = useAuth()
  const currentUserId = user?.uid ?? DEMO_CODING_USER_ID
  const isUsingDemoUser = !authLoading && !user

  const selectedCompany = useMemo(
    () => getCompanyById(selectedCompanyId) ?? companies[0],
    [selectedCompanyId]
  )

  const behavioralQuestions = useMemo(
    () => getQuestionsByCompany(selectedCompanyId, "behavioral"),
    [selectedCompanyId]
  )

  const codingQuestions = useMemo(
    () => {
      const pool = getAdaptiveCodingQuestions(selectedCompanyId)

      if (difficultyFilter === "all") {
        return pool
      }

      return pool.filter((question) => question.difficulty === difficultyFilter)
    },
    [difficultyFilter, selectedCompanyId]
  )

  const currentDifficulty = useMemo(
    () => getAdaptiveDifficulty(userScore),
    [userScore]
  )

  const difficultyCounts = useMemo(() => {
    return codingQuestions.reduce(
      (counts, question) => {
        counts[question.difficulty] += 1
        return counts
      },
      { easy: 0, medium: 0, hard: 0 }
    )
  }, [codingQuestions])

  const isCurrentQuestionAnswered = currentQuestion ? seenQuestionIds.includes(currentQuestion.id) : false
  const codingLibraryPreview = codingQuestions.slice(0, 6)

  async function loadSavedAnswers(userId: string) {
    setIsAnswersLoading(true)
    setAnswersError(null)

    try {
      const answers = await getAnswers(userId, {
        type: "coding",
        limitCount: 5,
      })
      setSavedAnswers(answers)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load saved coding answers right now."

      setSavedAnswers([])
      setAnswersError(message)
    } finally {
      setIsAnswersLoading(false)
    }
  }

  function loadNextQuestion(nextScore: number, nextSeenIds: string[], excludeQuestionId?: string | null) {
    const nextQuestion = pickNextAdaptiveQuestion({
      companyId: selectedCompanyId,
      userScore: nextScore,
      seenQuestionIds: nextSeenIds,
      excludeQuestionId,
      difficultyFilter,
    })

    setCurrentQuestion(nextQuestion)
  }

  async function handleRecordOutcome(isCorrect: boolean) {
    if (!currentQuestion || isCurrentQuestionAnswered) {
      return
    }

    setIsSavingAnswer(true)
    setActionError(null)
    setActionMessage(null)

    const nextScore = userScore + (isCorrect ? 1 : -1)
    const nextSeenIds = [...seenQuestionIds, currentQuestion.id]

    try {
      const saveResult = await saveAnswer(user?.uid ?? null, {
        type: "coding",
        category: "coding",
        question: currentQuestion.title,
        questionText: currentQuestion.title,
        answer: getQuestionSummary(currentQuestion, isCorrect, nextScore),
        rating: getAdaptiveRating(isCorrect, currentQuestion.difficulty),
        score: getAdaptiveRating(isCorrect, currentQuestion.difficulty),
        feedback: getOutcomeFeedback(isCorrect, currentQuestion),
        company: selectedCompany?.name ?? "Coding Practice",
        topic: getTopicLabel(currentQuestion.topic),
        difficulty: currentQuestion.difficulty,
        isCorrect,
        timeTakenSeconds: 0,
        createdAt: new Date().toISOString(),
        questionId: currentQuestion.id,
        companySlug: selectedCompany?.id ?? null,
        aiFeedback: {
          strengths: isCorrect ? ["Solved the adaptive coding question"] : [],
          improvements: isCorrect ? [] : [`Review the ${getTopicLabel(currentQuestion.topic)} pattern`],
          suggestions: isCorrect
            ? ["Take the next adaptive question at a higher difficulty if available."]
            : ["Retry a similar question and focus on the core pattern first."],
          ratingExplanation: getOutcomeFeedback(isCorrect, currentQuestion),
        },
        status: isCorrect ? "solved" : "failed",
      })

      setSavedAnswers((current) => [saveResult.answer, ...current].slice(0, 5))
      setUserScore(nextScore)
      setSeenQuestionIds(nextSeenIds)
      setActionMessage(
        saveResult.status === "cloud"
          ? `Saved. Adaptive difficulty is now ${getAdaptiveDifficulty(nextScore)}.`
          : `Saved locally. Adaptive difficulty is now ${getAdaptiveDifficulty(nextScore)}.`
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not save this attempt right now."
      setActionError(message)
    } finally {
      setIsSavingAnswer(false)
    }
  }

  function handleNextQuestion() {
    const nextSeenIds =
      currentQuestion && !seenQuestionIds.includes(currentQuestion.id)
        ? [...seenQuestionIds, currentQuestion.id]
        : seenQuestionIds

    setSeenQuestionIds(nextSeenIds)
    setActionMessage(null)
    setActionError(null)
    loadNextQuestion(userScore, nextSeenIds, currentQuestion?.id ?? null)
  }

  function handleResetSession() {
    setUserScore(0)
    setSeenQuestionIds([])
    setActionMessage(null)
    setActionError(null)
    loadNextQuestion(0, [])
  }

  useEffect(() => {
    if (authLoading) {
      return
    }

    void loadSavedAnswers(currentUserId)
  }, [authLoading, currentUserId])

  useEffect(() => {
    setUserScore(0)
    setSeenQuestionIds([])
    setActionMessage(null)
    setActionError(null)
    loadNextQuestion(0, [])
  }, [difficultyFilter, selectedCompanyId])

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Practice Questions</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Explore company-specific behavioral prompts and a 50+ question adaptive coding pool that adjusts difficulty based on how you perform.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary/80">
                Company-Based Library
              </p>
              <CardTitle className="mt-2">Select a company</CardTitle>
              <CardDescription className="mt-2">
                Behavioral prompts stay company-specific, and the coding pool narrows to tagged questions for the company you are targeting.
              </CardDescription>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Company</p>
              <Select value={selectedCompanyId} onValueChange={(value) => setSelectedCompanyId(value as CompanySlug)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full max-w-xs space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Difficulty filter</p>
              <Select
                value={difficultyFilter}
                onValueChange={(value) => setDifficultyFilter(value as AdaptiveCodingQuestion["difficulty"] | "all")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{selectedCompany?.name}</Badge>
            {selectedCompany?.roles.map((role) => (
              <Badge key={role} variant="outline" className="bg-muted/40">
                {role}
              </Badge>
            ))}
            <Badge variant="outline" className="bg-primary/10 text-primary">
              {codingQuestions.length} coding questions
            </Badge>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Behavioral Questions</CardTitle>
                <CardDescription>
                  Common interview prompts for {selectedCompany?.name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {behavioralQuestions.map((question, index) => (
                  <div key={`${selectedCompanyId}-behavioral-${index}`} className="rounded-2xl border bg-muted/10 p-4">
                    <div className="flex items-start gap-3">
                      <Badge className="mt-0.5 bg-primary/15 text-primary hover:bg-primary/15">
                        {index + 1}
                      </Badge>
                      <p className="text-sm leading-6 text-foreground/90">{question}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border bg-card/95 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Coding Pool Snapshot</CardTitle>
                <CardDescription>
                  A lightweight preview of the larger adaptive question pool for {selectedCompany?.name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Easy: {difficultyCounts.easy}</Badge>
                  <Badge variant="outline">Medium: {difficultyCounts.medium}</Badge>
                  <Badge variant="outline">Hard: {difficultyCounts.hard}</Badge>
                </div>
                <div className="grid gap-3">
                  {codingLibraryPreview.map((question) => (
                    <div key={question.id} className="rounded-2xl border bg-muted/10 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">{question.title}</h3>
                            <Badge className={getDifficultyBadgeClassName(question.difficulty)}>
                              {formatDifficultyLabel(question.difficulty)}
                            </Badge>
                            <Badge variant="outline">{getTopicLabel(question.topic)}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Tagged for adaptive company practice with a direct LeetCode link.
                          </p>
                        </div>
                        <Button asChild variant="outline">
                          <a href={question.link} target="_blank" rel="noopener noreferrer">
                            Open Problem
                            <ArrowUpRight className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary/80">
                Adaptive Coding Practice
              </p>
              <CardTitle className="mt-2">Difficulty that reacts to your performance</CardTitle>
              <CardDescription className="mt-2">
                Start on medium. If you build a streak we move harder, and if you struggle we ease the next pick automatically.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleNextQuestion} disabled={!currentQuestion}>
                Next Question
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleResetSession}>
                <RotateCcw className="h-4 w-4" />
                Reset Session
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Adaptive score: {userScore}</Badge>
            <Badge className={getDifficultyBadgeClassName(currentDifficulty)}>
              Current difficulty: {formatDifficultyLabel(currentDifficulty)}
            </Badge>
            <Badge variant="outline">Seen this session: {seenQuestionIds.length}</Badge>
          </div>

          {isUsingDemoUser && (
            <p className="text-xs text-muted-foreground">
              Using demo coding profile <span className="font-medium">{DEMO_CODING_USER_ID}</span>.
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestion ? (
            <>
              <div className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getDifficultyBadgeClassName(currentQuestion.difficulty)}>
                        {formatDifficultyLabel(currentQuestion.difficulty)}
                      </Badge>
                      <Badge variant="outline">{getTopicLabel(currentQuestion.topic)}</Badge>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                        {currentQuestion.title}
                      </h3>
                      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                        Randomly selected from the company-tagged pool with repetition avoided inside this session.
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <a href={currentQuestion.link} target="_blank" rel="noopener noreferrer">
                      Open Problem
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                Adaptive rule: <code>score &gt;= 2</code> moves you to hard, <code>score &lt;= -1</code> moves you to easy, otherwise you stay on medium.
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => void handleRecordOutcome(true)}
                  disabled={isSavingAnswer || isCurrentQuestionAnswered}
                >
                  Solved (+1)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleRecordOutcome(false)}
                  disabled={isSavingAnswer || isCurrentQuestionAnswered}
                >
                  Wrong (-1)
                </Button>
                {isCurrentQuestionAnswered && (
                  <p className="self-center text-sm text-muted-foreground">
                    This question is logged for the session. Use Next Question to continue.
                  </p>
                )}
              </div>

              {actionMessage && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                  {actionMessage}
                </div>
              )}

              {actionError && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {actionError}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border bg-muted/20 p-6 text-sm text-muted-foreground">
              No coding question is available for this company yet. Try another company or reset the session.
            </div>
          )}

          <CodingAnswerHistoryCard
            answers={savedAnswers}
            isLoading={isAnswersLoading}
            error={answersError}
          />
        </CardContent>
      </Card>
    </main>
  )
}
