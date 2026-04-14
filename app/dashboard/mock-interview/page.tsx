"use client"

import { useEffect, useMemo, useState } from "react"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"

import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { companies, getCompanyById } from "@/data/companies"
import type { CompanySlug } from "@/data/types"
import questionsData from "@/data/questions.json"
import { AIFeedbackCard } from "@/components/AIFeedbackCard"
import { evaluateBehavioralAnswer } from "@/lib/behavioral-evaluation"
import { db } from "@/lib/firebase"
import { saveAnswer } from "@/lib/firestore/userDataService"
import type { AIFeedback } from "@/types/answers"
import type { BehavioralEvaluationResponse } from "@/types/behavioral-evaluation"

type InterviewType = "coding" | "behavioral" | "mixed"

type SessionQuestion = {
  id: string
  type: "coding" | "behavioral"
  title: string
  prompt: string
  topic: string
  difficulty: string
}

type SessionResult = {
  questionId: string
  type: "coding" | "behavioral"
  score: number
  clarity: number
  structure: number
  impact: number
  timeTakenSeconds: number
  aiFeedback: AIFeedback
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function buildBehavioralFeedback(score: number, evaluationFeedback: string, improvement: string): AIFeedback {
  return {
    strengths: score >= 7 ? ["Clear structure and strong relevance to the prompt."] : [],
    improvements: improvement ? [improvement] : [],
    suggestions: score >= 7 ? ["Tighten the ending with one measurable result if possible."] : ["Use STAR order and make your role explicit."],
    ratingExplanation: evaluationFeedback,
  }
}

function buildCodingFeedback(answer: string, topic: string, difficulty: string): { score: number; aiFeedback: AIFeedback } {
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0
  const score = wordCount >= 90 ? 8 : wordCount >= 50 ? 6 : wordCount >= 20 ? 4 : 2

  return {
    score,
    aiFeedback: {
      strengths: score >= 7 ? ["You explained the approach with enough depth to sound interview-ready."] : [],
      improvements: score >= 7 ? [] : ["The solution explanation is still a bit thin for a real interview."],
      suggestions: [
        `Call out the core ${topic.toLowerCase()} pattern explicitly.`,
        `State the final time and space complexity for this ${difficulty.toLowerCase()} problem.`,
      ],
      ratingExplanation:
        score >= 7
          ? "Solid coding explanation with enough structure to discuss in an interview."
          : "The answer needs more algorithm reasoning, edge cases, and complexity discussion.",
    },
  }
}

function pickSessionQuestions(companyId: string, interviewType: InterviewType): SessionQuestion[] {
  const company = getCompanyById(companyId)
  if (!company) {
    return []
  }

  const codingPool = shuffle(
    (questionsData.coding as Array<{ id: string; title: string; company: string; topic: string; difficulty: string }>)
      .filter((question) => question.company === companyId)
  ).slice(0, interviewType === "coding" ? 4 : 2)
  const behavioralPool = shuffle(
    (questionsData.behavioral as Array<{ company: string; id: string; title: string; question: string; category: string; difficulty: string }>)
      .filter((question) => question.company === companyId)
  ).slice(0, interviewType === "behavioral" ? 4 : 2)

  const codingQuestions: SessionQuestion[] = codingPool.map((question) => ({
    id: question.id,
    type: "coding",
    title: question.title,
    prompt: `Explain how you would solve ${question.title}.`,
    topic: question.topic,
    difficulty: question.difficulty,
  }))

  const behavioralQuestions: SessionQuestion[] = behavioralPool.map((question) => ({
    id: question.id,
    type: "behavioral",
    title: question.title,
    prompt: question.question,
    topic: question.category,
    difficulty: question.difficulty,
  }))

  if (interviewType === "coding") {
    return codingQuestions
  }

  if (interviewType === "behavioral") {
    return behavioralQuestions
  }

  return shuffle([...codingQuestions, ...behavioralQuestions]).slice(0, 4)
}

const QUESTION_DURATION_SECONDS = 120

export default function DashboardMockInterviewPage() {
  const { user } = useAuth()
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.id ?? "google")
  const [selectedRole, setSelectedRole] = useState(companies[0]?.roles[0] ?? "Software Engineer")
  const [interviewType, setInterviewType] = useState<InterviewType>("mixed")
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<SessionResult[]>([])
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION_SECONDS)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null)
  const [sessionSummary, setSessionSummary] = useState<{
    averageScore: number
    clarity: number
    structure: number
    impact: number
    feedback: AIFeedback[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const company = useMemo(() => getCompanyById(selectedCompanyId), [selectedCompanyId])
  const currentQuestion = sessionQuestions[currentQuestionIndex] ?? null

  useEffect(() => {
    if (!isRunning || !currentQuestion) {
      return
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          void handleSubmitCurrent(true)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isRunning, currentQuestionIndex, currentQuestion?.id])

  useEffect(() => {
    if (company?.roles[0]) {
      setSelectedRole(company.roles[0])
    }
  }, [company?.id])

  async function handleSubmitCurrent(autoSubmitted = false) {
    if (!currentQuestion || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    const answer = answers[currentQuestion.id] ?? ""
    const timeTakenSeconds = QUESTION_DURATION_SECONDS - timeLeft

    try {
      let score = 0
      let aiFeedback: AIFeedback
      let clarity = 0
      let structure = 0
      let impact = 0
      let behavioralEvaluation: BehavioralEvaluationResponse | null = null

      if (currentQuestion.type === "behavioral") {
        if (!answer.trim()) {
          score = 1
          const lowScore = 1
          aiFeedback = {
            strengths: [],
            improvements: ["No answer was recorded before the timer ended."],
            suggestions: ["Practice a shorter STAR version so you can respond under time pressure."],
            ratingExplanation: "The question auto-submitted before a meaningful behavioral answer was captured.",
          }
          const result: SessionResult = {
            questionId: currentQuestion.id,
            type: currentQuestion.type,
            score,
            clarity: lowScore,
            structure: lowScore,
            impact: lowScore,
            timeTakenSeconds,
            aiFeedback,
          }

          if (user?.uid) {
            await saveAnswer(user.uid, {
              type: currentQuestion.type,
              category: "behavioral",
              questionId: currentQuestion.id,
              question: currentQuestion.prompt,
              questionText: currentQuestion.prompt,
              answer: answer || (autoSubmitted ? "Auto-submitted after timer expiry." : ""),
              rating: score,
              score,
              feedback: aiFeedback.ratingExplanation,
              company: company?.name ?? "Mock Interview",
              topic: currentQuestion.topic,
              difficulty: currentQuestion.difficulty,
              isCorrect: null,
              timeTakenSeconds,
              createdAt: new Date().toISOString(),
              aiFeedback,
              evaluation: {
                label: "weak",
                display_label: "weak",
                confidence: 0.95,
                class_probabilities: { weak: 0.95, average: 0.04, strong: 0.01 },
                score_clarity: lowScore,
                score_structure: lowScore,
                score_impact: lowScore,
                missing: ["specific situation", "clear action", "clear result"],
                feedback: aiFeedback.ratingExplanation,
                suggested_improvement: "Practice a complete STAR response.",
                interpretation: "This answer auto-submitted before a meaningful response was captured.",
                is_invalid_answer: true,
                validation_message: null,
              },
            })
          }

          const nextResults = [...results, result]
          setResults(nextResults)

          if (currentQuestionIndex >= sessionQuestions.length - 1) {
            setIsRunning(false)
            const averageScore = Math.round(nextResults.reduce((sum, item) => sum + item.score, 0) / nextResults.length)
            const overallClarity = Math.round(nextResults.reduce((sum, item) => sum + item.clarity, 0) / nextResults.length)
            const overallStructure = Math.round(nextResults.reduce((sum, item) => sum + item.structure, 0) / nextResults.length)
            const overallImpact = Math.round(nextResults.reduce((sum, item) => sum + item.impact, 0) / nextResults.length)
            setSessionSummary({
              averageScore,
              clarity: overallClarity,
              structure: overallStructure,
              impact: overallImpact,
              feedback: nextResults.map((item) => item.aiFeedback),
            })

            if (user?.uid) {
              await addDoc(collection(db, "users", user.uid, "mock_sessions"), {
                uid: user.uid,
                sessionId: `${user.uid}-${Date.now()}`,
                companyId: selectedCompanyId,
                role: selectedRole,
                interviewType,
                questions: sessionQuestions,
                currentQuestionIndex,
                startTime: sessionStartedAt ?? new Date().toISOString(),
                endTime: new Date().toISOString(),
                scores: nextResults.map((item) => item.score),
                overallScore: averageScore,
                clarity: overallClarity,
                structure: overallStructure,
                impact: overallImpact,
                createdAt: serverTimestamp(),
              })
            }
          } else {
            setCurrentQuestionIndex((current) => current + 1)
            setTimeLeft(QUESTION_DURATION_SECONDS)
          }
          return
        } else {
          const evaluation = await evaluateBehavioralAnswer({
            question: currentQuestion.prompt,
            answer,
          })
          score = Math.round((evaluation.score_clarity + evaluation.score_structure + evaluation.score_impact) / 3)
          clarity = evaluation.score_clarity
          structure = evaluation.score_structure
          impact = evaluation.score_impact
          behavioralEvaluation = evaluation
          aiFeedback = buildBehavioralFeedback(
            score,
            evaluation.feedback,
            evaluation.suggested_improvement
          )
        }
      } else {
        const codingFeedback = buildCodingFeedback(answer, currentQuestion.topic, currentQuestion.difficulty)
        score = codingFeedback.score
        clarity = score
        structure = score
        impact = score
        aiFeedback = codingFeedback.aiFeedback
      }

      const result: SessionResult = {
        questionId: currentQuestion.id,
        type: currentQuestion.type,
        score,
        clarity,
        structure,
        impact,
        timeTakenSeconds,
        aiFeedback,
      }

      if (user?.uid) {
        await saveAnswer(user.uid, {
          type: currentQuestion.type,
          category: currentQuestion.type === "behavioral" ? "behavioral" : "coding",
          questionId: currentQuestion.id,
          question: currentQuestion.prompt,
          questionText: currentQuestion.prompt,
          answer: answer || (autoSubmitted ? "Auto-submitted after timer expiry." : ""),
          rating: score,
          score,
          feedback: aiFeedback.ratingExplanation,
          company: company?.name ?? "Mock Interview",
          topic: currentQuestion.topic,
          difficulty: currentQuestion.difficulty,
          isCorrect: currentQuestion.type === "coding" ? score >= 7 : null,
          timeTakenSeconds,
          createdAt: new Date().toISOString(),
          aiFeedback,
          passed: currentQuestion.type === "coding" ? score >= 7 : null,
          evaluation: behavioralEvaluation ?? undefined,
        })
      }

      const nextResults = [...results, result]
      setResults(nextResults)

      if (currentQuestionIndex >= sessionQuestions.length - 1) {
        setIsRunning(false)
        const averageScore = Math.round(nextResults.reduce((sum, item) => sum + item.score, 0) / nextResults.length)
        const overallClarity = Math.round(nextResults.reduce((sum, item) => sum + item.clarity, 0) / nextResults.length)
        const overallStructure = Math.round(nextResults.reduce((sum, item) => sum + item.structure, 0) / nextResults.length)
        const overallImpact = Math.round(nextResults.reduce((sum, item) => sum + item.impact, 0) / nextResults.length)
        setSessionSummary({
          averageScore,
          clarity: overallClarity,
          structure: overallStructure,
          impact: overallImpact,
          feedback: nextResults.map((item) => item.aiFeedback),
        })

        if (user?.uid) {
          await addDoc(collection(db, "users", user.uid, "mock_sessions"), {
            uid: user.uid,
            sessionId: `${user.uid}-${Date.now()}`,
            companyId: selectedCompanyId,
            role: selectedRole,
            interviewType,
            questions: sessionQuestions,
            currentQuestionIndex,
            startTime: sessionStartedAt ?? new Date().toISOString(),
            endTime: new Date().toISOString(),
            scores: nextResults.map((item) => item.score),
            overallScore: averageScore,
            clarity: overallClarity,
            structure: overallStructure,
            impact: overallImpact,
            createdAt: serverTimestamp(),
          })
        }
      } else {
        setCurrentQuestionIndex((current) => current + 1)
        setTimeLeft(QUESTION_DURATION_SECONDS)
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Could not evaluate this mock interview response right now."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleStartSession() {
    const questions = pickSessionQuestions(selectedCompanyId, interviewType)
    setSessionQuestions(questions)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setResults([])
    setTimeLeft(QUESTION_DURATION_SECONDS)
    setSessionSummary(null)
    setError(null)
    setSessionStartedAt(new Date().toISOString())
    setIsRunning(true)
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mock Interview Simulation</p>
        <h1 className="text-3xl font-bold tracking-tight">Timed interview practice with saved results</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Build a short session, answer under time pressure, and let PlacePrep save the score, timing, and AI feedback back into Firestore.
        </p>
      </div>

      {!isRunning && !sessionSummary && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Set up your session</CardTitle>
            <CardDescription>Select a company, role, and interview type to generate 3-5 timed questions.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Select value={selectedCompanyId} onValueChange={(value) => setSelectedCompanyId(value as CompanySlug)}>
              <SelectTrigger>
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {(company?.roles ?? []).map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={interviewType} onValueChange={(value) => setInterviewType(value as InterviewType)}>
              <SelectTrigger>
                <SelectValue placeholder="Interview type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coding">Coding</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>

            <div className="md:col-span-3">
              <Button onClick={handleStartSession}>Start Mock Interview</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isRunning && currentQuestion && (
        <Card className="border shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>
                  Question {currentQuestionIndex + 1} of {sessionQuestions.length}
                </CardTitle>
                <CardDescription>{currentQuestion.type === "behavioral" ? "Behavioral" : "Coding"} • {currentQuestion.topic}</CardDescription>
              </div>
              <div className="rounded-full border px-3 py-1 text-sm font-medium text-foreground">
                {timeLeft}s left
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-muted/10 p-4">
              <p className="font-medium text-foreground">{currentQuestion.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{currentQuestion.prompt}</p>
            </div>

            <Textarea
              value={answers[currentQuestion.id] ?? ""}
              onChange={(event) =>
                setAnswers((current) => ({ ...current, [currentQuestion.id]: event.target.value }))
              }
              className="min-h-[220px]"
              placeholder={currentQuestion.type === "behavioral" ? "Write your STAR answer here..." : "Explain your approach, data structures, and complexity..."}
            />

            {error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button onClick={() => void handleSubmitCurrent()} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Answer"}
            </Button>
          </CardContent>
        </Card>
      )}

      {sessionSummary && (
        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Session Summary</CardTitle>
              <CardDescription>
                Average score {sessionSummary.averageScore}/10 across {results.length} timed answers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border bg-muted/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Clarity</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{sessionSummary.clarity}/10</p>
                </div>
                <div className="rounded-2xl border bg-muted/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Structure</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{sessionSummary.structure}/10</p>
                </div>
                <div className="rounded-2xl border bg-muted/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Impact</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{sessionSummary.impact}/10</p>
                </div>
              </div>
              {results.map((result, index) => (
                <div key={result.questionId} className="rounded-2xl border bg-muted/10 p-4">
                  <p className="font-medium text-foreground">
                    Q{index + 1}: {result.score}/10
                  </p>
                  <p className="mt-1">Time taken: {result.timeTakenSeconds}s</p>
                  <p className="mt-1">{result.aiFeedback.ratingExplanation}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {sessionSummary.feedback[0] && (
            <AIFeedbackCard score={sessionSummary.averageScore} feedback={sessionSummary.feedback[0]} />
          )}

          <Button onClick={() => setSessionSummary(null)}>Start Another Session</Button>
        </div>
      )}
    </main>
  )
}
