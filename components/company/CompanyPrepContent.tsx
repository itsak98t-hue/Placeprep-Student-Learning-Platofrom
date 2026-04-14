"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { BookOpen, Briefcase, Building2, FileQuestion, Layers3, Sparkles } from "lucide-react"

import { BehavioralFilters } from "@/components/behavioral/BehavioralFilters"
import { BehavioralPrepDialog } from "@/components/behavioral/BehavioralPrepDialog"
import { BehavioralProgressSummary } from "@/components/behavioral/BehavioralProgressSummary"
import { BehavioralQuestionCard } from "@/components/behavioral/BehavioralQuestionCard"
import { CodingAttemptModal } from "@/components/coding/CodingAttemptModal"
import { CodingAnswerHistoryCard } from "@/components/coding/CodingAnswerHistoryCard"
import { CodingExplanationPanel } from "@/components/coding/CodingExplanationPanel"
import { CodingRecommendationBanner } from "@/components/coding/CodingRecommendationBanner"
import InterviewExperienceForm from "@/components/InterviewExperienceForm"
import { useAuth } from "@/components/providers/AuthProvider"
import { QuestionCard } from "@/components/practice/QuestionCard"
import { QuestionFilters } from "@/components/practice/QuestionFilters"
import { QuestionProgressSummary } from "@/components/practice/QuestionProgressSummary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  allBehavioralCategories,
  allBehavioralFrequencies,
  behavioralQuestionsByCompany,
  filterBehavioralQuestions,
  parseBehavioralCategoryParam,
  rankBehavioralQuestions,
} from "@/data/behavioral"
import { allQuestionDifficulties, allQuestionRounds, allQuestionTopics, practiceQuestionsByCompany } from "@/data/questions/index"
import { filterPracticeQuestions, isPracticeCompanySlug } from "@/data/questions/utils"
import type {
  BehavioralCategory,
  BehavioralQuestion,
  CompanySlug,
  InterviewRound,
  QuestionDifficulty,
  QuestionFrequency,
  QuestionTopic,
} from "@/data/types"
import { useBehavioralProgress } from "@/hooks/use-behavioral-progress"
import { useQuestionProgress } from "@/hooks/use-question-progress"
import { getRecentBehavioralAttemptsForUser } from "@/lib/behavioral-attempts"
import { getAnswers, saveAnswer } from "@/lib/firestore/userDataService"
import { computeBehavioralInsights } from "@/lib/behavioral-insights"
import {
  enrichCodingQuestion,
  findCodingQuestionByPracticeQuestion,
  findPracticeQuestionMatch,
  isPracticeQuestionRecommended,
} from "@/lib/coding-question-bridge"
import {
  fetchCodingExplanation,
  fetchCodingRecommendation,
  fetchCodingUserStats,
  getCodingDifficultyLabel,
  submitCodingAttempt,
} from "@/lib/coding-recommendation"
import type {
  CodingAttemptRequest,
  CodingExplainRequest,
  CodingExplainResponse,
  CodingQuestion,
  CodingRecommendationResponse,
  UserStatsResponse,
} from "@/types/coding"
import type { SavedBehavioralAttempt } from "@/types/behavioral"
import type { UserAnswer } from "@/types/answers"
import type { CompanyDetail } from "@/types/company"

type CompanyPrepContentProps = {
  company: CompanyDetail
  companySlug: string
}

const DEMO_CODING_USER_ID = "demo-user-1"

function getCodingAnswerRating(status: CodingAttemptRequest["status"], confidence: number) {
  if (status === "solved") {
    return Math.min(10, 7 + confidence)
  }

  if (status === "partial") {
    return Math.min(7, 4 + confidence)
  }

  if (status === "failed") {
    return Math.max(2, confidence + 1)
  }

  return 2
}

function buildCodingAnswerSummary(values: Omit<CodingAttemptRequest, "user_id" | "question_id">) {
  return `Status: ${values.status}. Time spent: ${values.time_spent_min} min. Hints used: ${values.hints_used}. Confidence: ${values.confidence}/5.`
}

export function CompanyPrepContent({
  company,
  companySlug,
}: CompanyPrepContentProps) {
  const supportedCompany = isPracticeCompanySlug(companySlug)
  const practiceCompanySlug: CompanySlug | null = supportedCompany ? companySlug : null

  const questionSet = practiceCompanySlug ? (practiceQuestionsByCompany[practiceCompanySlug] ?? []) : []
  const behavioralQuestionSet = practiceCompanySlug ? (behavioralQuestionsByCompany[practiceCompanySlug] ?? []) : []
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState("overview")
  const [questionMode, setQuestionMode] = useState<"technical" | "behavioral">("technical")
  const [roundFilter, setRoundFilter] = useState<InterviewRound | "All">("All")
  const [difficultyFilter, setDifficultyFilter] = useState<QuestionDifficulty | "All">("All")
  const [topicFilter, setTopicFilter] = useState<QuestionTopic | "All">("All")
  const [behavioralCategoryFilter, setBehavioralCategoryFilter] = useState<BehavioralCategory | "All">("All")
  const [behavioralFrequencyFilter, setBehavioralFrequencyFilter] = useState<QuestionFrequency | "All">("All")
  const [selectedBehavioralQuestion, setSelectedBehavioralQuestion] = useState<BehavioralQuestion | null>(null)
  const [isBehavioralPrepOpen, setIsBehavioralPrepOpen] = useState(false)
  const [behavioralAttempts, setBehavioralAttempts] = useState<SavedBehavioralAttempt[]>([])
  const [codingRecommendation, setCodingRecommendation] = useState<CodingRecommendationResponse | null>(null)
  const [isCodingRecommendationLoading, setIsCodingRecommendationLoading] = useState(false)
  const [codingRecommendationError, setCodingRecommendationError] = useState<string | null>(null)
  const [codingUserStats, setCodingUserStats] = useState<UserStatsResponse | null>(null)
  const [codingAnswers, setCodingAnswers] = useState<UserAnswer[]>([])
  const [isCodingAnswersLoading, setIsCodingAnswersLoading] = useState(false)
  const [codingAnswersError, setCodingAnswersError] = useState<string | null>(null)
  const [codingFeedbackMessage, setCodingFeedbackMessage] = useState<string | null>(null)
  const [isAttemptModalOpen, setIsAttemptModalOpen] = useState(false)
  const [selectedCodingQuestion, setSelectedCodingQuestion] = useState<CodingQuestion | null>(null)
  const [selectedPracticeQuestionId, setSelectedPracticeQuestionId] = useState<string | null>(null)
  const [initialHintsUsed, setInitialHintsUsed] = useState(0)
  const [isSubmittingAttempt, setIsSubmittingAttempt] = useState(false)
  const [attemptSubmissionError, setAttemptSubmissionError] = useState<string | null>(null)
  const [pendingExplanationRequest, setPendingExplanationRequest] = useState<CodingExplainRequest | null>(null)
  const [codingExplanation, setCodingExplanation] = useState<CodingExplainResponse | null>(null)
  const [isCodingExplanationLoading, setIsCodingExplanationLoading] = useState(false)
  const [codingExplanationError, setCodingExplanationError] = useState<string | null>(null)
  const [explanationQuestionTitle, setExplanationQuestionTitle] = useState<string | null>(null)

  const progress = useQuestionProgress(questionSet)
  const behavioralProgress = useBehavioralProgress(behavioralQuestionSet)
  const { user, loading: authLoading } = useAuth()
  // TODO: replace demo fallback once coding history is fully tied to persisted auth-backed profiles.
  const currentUserId = user?.uid ?? DEMO_CODING_USER_ID
  const behavioralInsights = useMemo(
    () => computeBehavioralInsights(behavioralAttempts),
    [behavioralAttempts]
  )

  const filteredQuestions = useMemo(() => {
    return filterPracticeQuestions(questionSet, {
      round: roundFilter,
      difficulty: difficultyFilter,
      topic: topicFilter,
    })
  }, [questionSet, roundFilter, difficultyFilter, topicFilter])

  const filteredBehavioralQuestions = useMemo(() => {
    const filteredQuestions = filterBehavioralQuestions(behavioralQuestionSet, {
      category: behavioralCategoryFilter,
      frequency: behavioralFrequencyFilter,
    })

    return rankBehavioralQuestions(filteredQuestions, behavioralInsights?.weakestCategory ?? null)
  }, [
    behavioralQuestionSet,
    behavioralCategoryFilter,
    behavioralFrequencyFilter,
    behavioralInsights?.weakestCategory,
  ])
  const categoryParam = searchParams.get("category")
  const parsedCategoryFromUrl = useMemo(
    () => parseBehavioralCategoryParam(categoryParam),
    [categoryParam]
  )
  const hasCategoryFilterFromUrl = Boolean(categoryParam && parsedCategoryFromUrl)

  const adaptiveSnapshot = useMemo(() => {
    if (!codingUserStats?.summary) {
      return null
    }

    const focusTopics = codingUserStats.summary.focus_topics
      .slice(0, 2)
      .map((topic) =>
        topic
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      )

    if (focusTopics.length === 0) {
      return null
    }

    return `Adaptive focus right now: ${focusTopics.join(" and ")}.`
  }, [codingUserStats])

  useEffect(() => {
    const tab = searchParams.get("tab")
    const mode = searchParams.get("mode")
    const parsedCategory = parseBehavioralCategoryParam(searchParams.get("category"))

    if (tab === "questions") {
      setActiveTab("questions")
    }

    if (mode === "behavioral") {
      setQuestionMode("behavioral")
    }

    setBehavioralCategoryFilter(parsedCategory ?? "All")
  }, [searchParams])

  function clearBehavioralCategoryFilter() {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "questions")
    params.set("mode", "behavioral")
    params.delete("category")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const jumpToRoundQuestions = (round: InterviewRound) => {
    setRoundFilter(round)
    setQuestionMode(round === "Behavioral" ? "behavioral" : "technical")
    setActiveTab("questions")
  }

  const openBehavioralPrep = (question: BehavioralQuestion) => {
    setSelectedBehavioralQuestion(question)
    setIsBehavioralPrepOpen(true)
  }

  const resolveMappedRound = (roundTitle: string): InterviewRound | null => {
    const normalized = roundTitle.toLowerCase()

    if (normalized.includes("online")) return "Online Assessment"
    if (normalized.includes("technical round 1")) return "Technical Round 1"
    if (normalized.includes("technical round 2")) return "Technical Round 2"
    if (normalized.includes("behavioral") || normalized.includes("googlyness") || normalized.includes("managerial")) {
      return "Behavioral"
    }
    if (normalized.includes("hiring committee")) return "Hiring Committee"

    return null
  }

  async function loadCodingRecommendation(userId: string) {
    setIsCodingRecommendationLoading(true)
    setCodingRecommendationError(null)

    try {
      const response = await fetchCodingRecommendation({
        user_id: userId,
        target_company: company.name,
      })

      setCodingRecommendation({
        ...response,
        primary_question: enrichCodingQuestion(response.primary_question)!,
        easier_questions: response.easier_questions
          .map((question) => enrichCodingQuestion(question))
          .filter((question): question is CodingQuestion => question !== null),
        harder_questions: response.harder_questions
          .map((question) => enrichCodingQuestion(question))
          .filter((question): question is CodingQuestion => question !== null),
        similar_questions: response.similar_questions
          .map((question) => enrichCodingQuestion(question))
          .filter((question): question is CodingQuestion => question !== null),
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load your coding recommendation right now."

      setCodingRecommendation(null)
      setCodingRecommendationError(message)
    } finally {
      setIsCodingRecommendationLoading(false)
    }
  }

  async function loadCodingUserStats(userId: string) {
    try {
      const response = await fetchCodingUserStats(userId)
      setCodingUserStats(response)
    } catch {
      setCodingUserStats(null)
    }
  }

  async function loadCodingAnswers(userId: string) {
    setIsCodingAnswersLoading(true)
    setCodingAnswersError(null)

    try {
      const answers = await getAnswers(userId, {
        type: "coding",
        limitCount: 5,
      })
      setCodingAnswers(answers)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load saved coding answers right now."

      setCodingAnswers([])
      setCodingAnswersError(message)
    } finally {
      setIsCodingAnswersLoading(false)
    }
  }

  async function refreshAdaptiveCodingData(userId: string) {
    await Promise.allSettled([
      loadCodingRecommendation(userId),
      loadCodingUserStats(userId),
      loadCodingAnswers(userId),
    ])
  }

  async function handleFetchCodingExplanation() {
    if (!pendingExplanationRequest) {
      return
    }

    setIsCodingExplanationLoading(true)
    setCodingExplanationError(null)

    try {
      const response = await fetchCodingExplanation(pendingExplanationRequest)
      setCodingExplanation(response)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not fetch AI explanation right now."

      setCodingExplanation(null)
      setCodingExplanationError(message)
    } finally {
      setIsCodingExplanationLoading(false)
    }
  }

  function handleAttemptModalOpenChange(open: boolean) {
    setIsAttemptModalOpen(open)

    if (open) {
      return
    }

    setSelectedCodingQuestion(null)
    setSelectedPracticeQuestionId(null)
    setInitialHintsUsed(0)
    setAttemptSubmissionError(null)
  }

  function openAttemptModal(question: CodingQuestion, practiceQuestionId: string | null, hintsUsed = 0) {
    setSelectedCodingQuestion(question)
    setSelectedPracticeQuestionId(practiceQuestionId)
    setInitialHintsUsed(hintsUsed)
    setAttemptSubmissionError(null)
    setIsAttemptModalOpen(true)
  }

  function openRecommendationAttemptModal(question: CodingQuestion, hintsUsed: number) {
    const linkedPracticeQuestion = findPracticeQuestionMatch(question, questionSet)
    openAttemptModal(question, linkedPracticeQuestion?.id ?? null, hintsUsed)
  }

  function openGridAttemptModal(question: (typeof questionSet)[number]) {
    const mappedCodingQuestion = findCodingQuestionByPracticeQuestion(question)

    if (!mappedCodingQuestion) {
      setCodingFeedbackMessage(
        "Adaptive sync is currently available for the recommended external-bank questions and seeded overlaps. This card still works in the regular practice flow."
      )
      return
    }

    openAttemptModal(mappedCodingQuestion, question.id, 0)
  }

  async function handleAttemptSubmit(values: Omit<CodingAttemptRequest, "user_id" | "question_id">) {
    if (!selectedCodingQuestion) {
      return
    }

    setIsSubmittingAttempt(true)
    setAttemptSubmissionError(null)

    try {
      const response = await submitCodingAttempt({
        user_id: currentUserId,
        question_id: selectedCodingQuestion.question_id,
        ...values,
      })

      if (selectedPracticeQuestionId) {
        if (values.status === "solved" && !progress.isSolved(selectedPracticeQuestionId)) {
          progress.toggleSolved(selectedPracticeQuestionId)
        } else if (values.status !== "solved" && !progress.isAttempted(selectedPracticeQuestionId)) {
          progress.toggleAttempted(selectedPracticeQuestionId)
        }
      }

      handleAttemptModalOpenChange(false)
      const saveResult = await saveAnswer(user?.uid ?? null, {
        type: "coding",
        category: "coding",
        question: selectedCodingQuestion.title,
        questionText: selectedCodingQuestion.title,
        answer: buildCodingAnswerSummary(values),
        rating: getCodingAnswerRating(values.status, values.confidence),
        score: getCodingAnswerRating(values.status, values.confidence),
        feedback: response.message || "Progress saved.",
        company: company.name,
        topic: selectedCodingQuestion.topic,
        difficulty: getCodingDifficultyLabel(selectedCodingQuestion.difficulty).toLowerCase(),
        isCorrect: values.status === "solved",
        timeTakenSeconds: values.time_spent_min * 60,
        createdAt: new Date().toISOString(),
        questionId: selectedCodingQuestion.question_id,
        companySlug: companySlug,
        aiFeedback: {
          strengths: values.status === "solved" ? ["You completed the problem successfully."] : [],
          improvements:
            values.status === "solved"
              ? []
              : ["Keep tightening the approach before coding the full solution."],
          suggestions:
            values.status === "solved"
              ? ["Try the next recommended question to maintain momentum."]
              : ["Use the AI explanation to target the weakest part of your attempt."],
          ratingExplanation: response.message || "Coding attempt recorded.",
        },
        status: values.status,
        timeSpentMin: values.time_spent_min,
        hintsUsed: values.hints_used,
      })

      setCodingFeedbackMessage(response.message || "Progress saved.")
      setCodingAnswers((current) => [saveResult.answer, ...current].slice(0, 5))
      if (values.status === "failed" || values.status === "partial") {
        setPendingExplanationRequest({
          user_id: currentUserId,
          question_id: selectedCodingQuestion.question_id,
          status: values.status,
          time_spent_min: values.time_spent_min,
          hints_used: values.hints_used,
          confidence: values.confidence,
        })
        setExplanationQuestionTitle(selectedCodingQuestion.title)
        setCodingExplanation(null)
        setCodingExplanationError(null)
      } else {
        setPendingExplanationRequest(null)
        setExplanationQuestionTitle(null)
        setCodingExplanation(null)
        setCodingExplanationError(null)
      }
      await refreshAdaptiveCodingData(currentUserId)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not save your coding attempt right now."

      setAttemptSubmissionError(message)
    } finally {
      setIsSubmittingAttempt(false)
    }
  }

  useEffect(() => {
    if (!supportedCompany || authLoading) {
      return
    }

    void refreshAdaptiveCodingData(currentUserId)
  }, [authLoading, company.name, currentUserId, supportedCompany])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user?.uid) {
      setBehavioralAttempts([])
      return
    }

    let isActive = true

    void getRecentBehavioralAttemptsForUser(user.uid, 24)
      .then((attempts) => {
        if (isActive) {
          setBehavioralAttempts(attempts)
        }
      })
      .catch(() => {
        if (isActive) {
          setBehavioralAttempts([])
        }
      })

    return () => {
      isActive = false
    }
  }, [authLoading, user?.uid])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <BehavioralPrepDialog
        open={isBehavioralPrepOpen}
        question={selectedBehavioralQuestion}
        onOpenChange={setIsBehavioralPrepOpen}
      />
      <CodingAttemptModal
        open={isAttemptModalOpen}
        question={selectedCodingQuestion}
        initialHintsUsed={initialHintsUsed}
        isSubmitting={isSubmittingAttempt}
        error={attemptSubmissionError}
        onOpenChange={handleAttemptModalOpenChange}
        onSubmit={handleAttemptSubmit}
      />

      <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-muted/50 p-2 md:grid-cols-5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="process">Interview Rounds</TabsTrigger>
        <TabsTrigger value="questions">Question Bank</TabsTrigger>
        <TabsTrigger value="prep">Prep Guide</TabsTrigger>
        <TabsTrigger value="resources">Resources</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <InfoCard
            icon={Building2}
            title={`About ${company.name}`}
            description="Company intro, hiring focus, and what interviewers typically value."
          >
            <div className="space-y-3 text-sm leading-7 text-muted-foreground">
              {company.overview.map((point) => (
                <p key={point}>{point}</p>
              ))}
            </div>
          </InfoCard>

          <InfoCard
            icon={Briefcase}
            title="Eligibility & Expectations"
            description="What candidates should be comfortable with before applying."
          >
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {company.eligibility.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </InfoCard>
        </div>

        <InfoCard
          icon={FileQuestion}
          title="Online Assessment"
          description={company.onlineAssessment.format}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 font-semibold">Common Topics</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {company.onlineAssessment.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-semibold">How To Prepare</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {company.onlineAssessment.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </InfoCard>
      </TabsContent>

      <TabsContent value="process" className="space-y-6">
        <div className="grid gap-4">
          {company.interviewRounds.map((round) => (
            <Card key={round.title} className="border shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl">{round.title}</CardTitle>
                    <CardDescription className="mt-2">{round.focus}</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{round.duration}</Badge>
                    {supportedCompany && resolveMappedRound(round.title) && (
                      <Button variant="outline" onClick={() => jumpToRoundQuestions(resolveMappedRound(round.title)!)}>
                        Study This Round
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {round.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Share Interview Experience</CardTitle>
            <CardDescription>
              Collect candidate experiences so this company page keeps getting stronger over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InterviewExperienceForm companySlug={companySlug} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="questions" className="space-y-6">
        {supportedCompany ? (
          <>
            <Card className="border shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Question Bank Mode</p>
                  <h3 className="mt-1 text-lg font-semibold">Choose your prep lane</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Keep technical coding prep and behavioral storytelling prep separate, so each view stays focused.
                  </p>
                </div>
                <ToggleGroup
                  type="single"
                  value={questionMode}
                  onValueChange={(value) => value && setQuestionMode(value as "technical" | "behavioral")}
                  className="justify-start rounded-2xl border bg-muted/30 p-1"
                >
                  <ToggleGroupItem value="technical" variant="outline" className="rounded-xl px-4">
                    Technical Questions
                  </ToggleGroupItem>
                  <ToggleGroupItem value="behavioral" variant="outline" className="rounded-xl px-4">
                    Behavioral Questions
                  </ToggleGroupItem>
                </ToggleGroup>
              </CardContent>
            </Card>

            {questionMode === "technical" ? (
              <>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Technical Question Bank</p>
                  <h3 className="text-2xl font-semibold tracking-tight">Coding rounds, DSA patterns, and company-style technical practice</h3>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    This lane keeps the existing technical flow intact with round, difficulty, and topic filters.
                  </p>
                  {adaptiveSnapshot && (
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{adaptiveSnapshot}</p>
                  )}
                </div>

                {codingFeedbackMessage && (
                  <Card className="border shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">{codingFeedbackMessage}</p>
                    </CardContent>
                  </Card>
                )}

                {isCodingRecommendationLoading ? (
                  <Card className="border border-border/80 bg-card shadow-sm">
                    <CardContent className="space-y-4 p-6">
                      <Skeleton className="h-6 w-44 rounded-full" />
                      <Skeleton className="h-12 w-[28rem] max-w-full rounded-2xl" />
                      <Skeleton className="h-24 w-full rounded-2xl" />
                      <div className="flex flex-wrap gap-3">
                        <Skeleton className="h-10 w-32 rounded-xl" />
                        <Skeleton className="h-10 w-28 rounded-xl" />
                        <Skeleton className="h-10 w-28 rounded-xl" />
                        <Skeleton className="h-10 w-28 rounded-xl" />
                      </div>
                      <div className="rounded-2xl border border-border/70 bg-muted/10 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          AI recommendation loading
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Building your next adaptive recommendation based on topic weakness, recent struggle, and difficulty fit.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : codingRecommendation ? (
                  <CodingRecommendationBanner
                    currentUserId={currentUserId}
                    recommendation={codingRecommendation}
                    onOpenAttempt={openRecommendationAttemptModal}
                  />
                ) : (
                  <Card className="border border-border/80 bg-card shadow-sm">
                    <CardContent className="p-6">
                      <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        AI Recommended For You
                      </div>
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">
                        Your next adaptive recommendation will appear here once coding data is available.
                      </p>
                    </CardContent>
                  </Card>
                )}

                <QuestionProgressSummary
                  title={`${company.name} Technical Progress`}
                  solved={progress.summary.solved}
                  attempted={progress.summary.attempted}
                  bookmarked={progress.summary.bookmarked}
                  total={progress.summary.total}
                  easySolved={progress.summary.easySolved}
                  mediumSolved={progress.summary.mediumSolved}
                  hardSolved={progress.summary.hardSolved}
                />

                <QuestionFilters
                  round={roundFilter}
                  difficulty={difficultyFilter}
                  topic={topicFilter}
                  rounds={allQuestionRounds}
                  difficulties={allQuestionDifficulties}
                  topics={allQuestionTopics}
                  onRoundChange={setRoundFilter}
                  onDifficultyChange={setDifficultyFilter}
                  onTopicChange={setTopicFilter}
                />

                {pendingExplanationRequest && (
                  <CodingExplanationPanel
                    explanation={codingExplanation}
                    isLoading={isCodingExplanationLoading}
                    error={codingExplanationError}
                    questionTitle={explanationQuestionTitle}
                    onRequest={() => void handleFetchCodingExplanation()}
                  />
                )}

                <CodingAnswerHistoryCard
                  answers={codingAnswers}
                  isLoading={isCodingAnswersLoading}
                  error={codingAnswersError}
                />

                <div className="grid gap-6 xl:grid-cols-2">
                  {filteredQuestions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      solved={progress.isSolved(question.id)}
                      attempted={progress.isAttempted(question.id)}
                      bookmarked={progress.isBookmarked(question.id)}
                      recommended={isPracticeQuestionRecommended(question, codingRecommendation?.primary_question ?? null)}
                      onUpdateAttempt={() => openGridAttemptModal(question)}
                      onSolvedToggle={() => progress.toggleSolved(question.id)}
                      onAttemptedToggle={() => progress.toggleAttempted(question.id)}
                      onBookmarkedToggle={() => progress.toggleBookmarked(question.id)}
                    />
                  ))}
                </div>

                {filteredQuestions.length === 0 && (
                  <Card className="border shadow-sm">
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground">
                        No technical questions match the current filter combination. Try changing round, difficulty, or topic.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Behavioral Question Bank</p>
                  <h3 className="text-2xl font-semibold tracking-tight">Company-specific stories, interviewer signals, and STAR prep</h3>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    This lane is dedicated to behavioral prompts only, with category-based filtering and separate progress tracking.
                  </p>
                  {hasCategoryFilterFromUrl && parsedCategoryFromUrl && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Badge variant="outline" className="bg-background/70">
                        Category: {parsedCategoryFromUrl}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearBehavioralCategoryFilter}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>

                <BehavioralProgressSummary
                  title={`${company.name} Behavioral Prep Progress`}
                  prepared={behavioralProgress.summary.prepared}
                  bookmarked={behavioralProgress.summary.bookmarked}
                  total={behavioralProgress.summary.total}
                  categoryCounts={behavioralProgress.summary.categoryCounts}
                />

                <BehavioralFilters
                  category={behavioralCategoryFilter}
                  frequency={behavioralFrequencyFilter}
                  categories={allBehavioralCategories}
                  frequencies={allBehavioralFrequencies}
                  onCategoryChange={setBehavioralCategoryFilter}
                  onFrequencyChange={setBehavioralFrequencyFilter}
                />

                <div className="grid gap-6 xl:grid-cols-2">
                  {filteredBehavioralQuestions.map((question) => (
                    <BehavioralQuestionCard
                      key={question.id}
                      question={question}
                      prepared={behavioralProgress.isPrepared(question.id)}
                      bookmarked={behavioralProgress.isBookmarked(question.id)}
                      onOpenPrep={() => openBehavioralPrep(question)}
                      onPreparedToggle={() => behavioralProgress.togglePrepared(question.id)}
                      onBookmarkedToggle={() => behavioralProgress.toggleBookmarked(question.id)}
                    />
                  ))}
                </div>

                {filteredBehavioralQuestions.length === 0 && (
                  <Card className="border shadow-sm">
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground">
                        {hasCategoryFilterFromUrl && parsedCategoryFromUrl
                          ? `No questions found for ${parsedCategoryFromUrl} yet.`
                          : "No behavioral prompts match the current filters. Try changing category or frequency."}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        ) : (
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                A fully seeded question bank is currently available only for Google and Microsoft in this demo slice.
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="prep" className="space-y-6">
        <InfoCard
          icon={Sparkles}
          title="Preparation Strategy"
          description="Use these steps to turn the company page into an actual prep plan."
        >
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {company.preparationTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </InfoCard>
      </TabsContent>

      <TabsContent value="resources" className="space-y-6">
        <InfoCard
          icon={BookOpen}
          title="Helpful Resources"
          description="Direct links to practice, resume, and learning resources relevant to this company."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {company.resources.map((resource) => (
              <Card key={resource.label} className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{resource.label}</CardTitle>
                  <CardDescription>{resource.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={resource.href}>Open Resource</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </InfoCard>
      </TabsContent>
    </Tabs>
  )
}

function InfoCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Layers3
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
