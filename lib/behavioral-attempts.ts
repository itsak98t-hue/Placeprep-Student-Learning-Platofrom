import type {
  BehavioralAttempt,
  SaveAttemptResult,
  SavedBehavioralAttempt,
} from "@/types/behavioral"
import { getAnswers, saveAnswer } from "@/lib/firestore/userDataService"
import type { UserAnswer } from "@/types/answers"

type SaveBehavioralAttemptInput = {
  userId?: string | null
  attempt: BehavioralAttempt
}

function toSavedBehavioralAttempt(answer: UserAnswer, userId?: string | null): SavedBehavioralAttempt {
  const createdAt = answer.createdAt || new Date().toISOString()

  return {
    id: answer.id ?? `local-${Date.now()}-${answer.questionId ?? "behavioral"}`,
    userId: userId ?? "local-user",
    questionId: answer.questionId ?? "",
    questionText: answer.question,
    answerText: answer.answer,
    category: answer.behavioralCategory ?? null,
    label: answer.label ?? "average",
    display_label: answer.displayLabel ?? "Average Answer",
    confidence: answer.confidence ?? 0.5,
    score_clarity: answer.scoreClarity ?? 5,
    score_structure: answer.scoreStructure ?? 5,
    score_impact: answer.scoreImpact ?? 5,
    feedback: answer.feedback ?? "",
    suggested_improvement: answer.suggestedImprovement ?? "",
    interpretation: answer.interpretation ?? "",
    missing: Array.isArray(answer.missing) ? answer.missing : [],
    createdAt,
    updatedAt: createdAt,
  }
}

function toBehavioralAnswerRecord(attempt: BehavioralAttempt): UserAnswer {
  return {
    type: "behavioral",
    category: "behavioral",
    question: attempt.questionText,
    questionText: attempt.questionText,
    answer: attempt.answer,
    rating: Math.round((attempt.scoreClarity + attempt.scoreStructure + attempt.scoreImpact) / 3),
    score: Math.round((attempt.scoreClarity + attempt.scoreStructure + attempt.scoreImpact) / 3),
    feedback: attempt.feedback,
    company: attempt.companySlug ?? "behavioral",
    createdAt: attempt.createdAt,
    questionId: attempt.questionId,
    companySlug: attempt.companySlug ?? null,
    behavioralCategory: attempt.category ?? null,
    label: attempt.label,
    displayLabel: attempt.displayLabel,
    confidence: attempt.confidence,
    scoreClarity: attempt.scoreClarity,
    scoreStructure: attempt.scoreStructure,
    scoreImpact: attempt.scoreImpact,
    missing: attempt.missing,
    suggestedImprovement: attempt.suggestedImprovement,
    interpretation: attempt.interpretation,
    aiFeedback: {
      strengths: [],
      improvements: attempt.missing,
      suggestions: attempt.suggestedImprovement ? [attempt.suggestedImprovement] : [],
      ratingExplanation: attempt.interpretation || attempt.feedback,
    },
  }
}

export async function saveBehavioralAttempt({
  userId,
  attempt,
}: SaveBehavioralAttemptInput): Promise<SaveAttemptResult> {
  const saveResult = await saveAnswer(userId, toBehavioralAnswerRecord(attempt))

  return {
    status: saveResult.status,
    attempt: toSavedBehavioralAttempt(saveResult.answer, userId),
  }
}

export async function getRecentBehavioralAttempts(
  userId: string,
  questionId: string,
  limitCount = 5
): Promise<SavedBehavioralAttempt[]> {
  if (!questionId) {
    return []
  }

  const answers = await getAnswers(userId, {
    type: "behavioral",
  })

  return answers
    .filter((answer) => answer.questionId === questionId)
    .map((answer) => toSavedBehavioralAttempt(answer, userId))
    .slice(0, limitCount)
}

export async function getRecentBehavioralAttemptsForUser(
  userId: string,
  limitCount = 8
): Promise<SavedBehavioralAttempt[]> {
  const answers = await getAnswers(userId, {
    type: "behavioral",
    limitCount,
  })

  return answers.map((answer) => toSavedBehavioralAttempt(answer, userId))
}
