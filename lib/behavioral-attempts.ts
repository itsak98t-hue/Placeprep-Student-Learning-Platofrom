import { addDoc, collection, serverTimestamp } from "firebase/firestore"

import type {
  BehavioralAttempt,
  SaveAttemptResult,
  SavedBehavioralAttempt,
} from "@/types/behavioral"
import { getAnswers } from "@/lib/firestore/userDataService"
import { db } from "@/lib/firebase"
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
  const topicId =
    attempt.category?.trim().toLowerCase().replace(/\s+/g, "-") || attempt.questionId || "behavioral"

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
    courseId: "behavioral_hr",
    topicId,
    createdAt: attempt.createdAt,
    questionId: attempt.questionId,
    companySlug: attempt.companySlug ?? null,
    behavioralCategory: attempt.category ?? null,
    isCorrect: attempt.label === "strong",
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
    evaluation: {
      label: attempt.label,
      display_label: attempt.displayLabel,
      confidence: attempt.confidence,
      class_probabilities: {
        weak: attempt.label === "weak" ? 0.8 : 0.1,
        average: attempt.label === "average" ? 0.8 : 0.1,
        strong: attempt.label === "strong" ? 0.8 : 0.1,
      },
      score_clarity: attempt.scoreClarity,
      score_structure: attempt.scoreStructure,
      score_impact: attempt.scoreImpact,
      missing: attempt.missing,
      feedback: attempt.feedback,
      suggested_improvement: attempt.suggestedImprovement,
      interpretation: attempt.interpretation,
      is_invalid_answer: false,
      validation_message: null,
    },
  }
}

export async function saveBehavioralAttempt({
  userId,
  attempt,
}: SaveBehavioralAttemptInput): Promise<SaveAttemptResult> {
  if (!userId) {
    throw new Error("No authenticated user found when saving answer")
  }

  const record = toBehavioralAnswerRecord(attempt)

  try {
    const answerRef = await addDoc(collection(db, "users", userId, "answers"), {
      uid: userId,
      courseId: "behavioral_hr",
      topicId: attempt.category ?? "general",
      questionId: attempt.questionId,
      question: attempt.questionText,
      answer: attempt.answer,
      score: attempt.scoreClarity + attempt.scoreStructure + attempt.scoreImpact,
      isCorrect: attempt.label === "strong" || attempt.label === "average",
      evaluation: record.evaluation,
      answeredAt: serverTimestamp(),
      type: "behavioral",
    })

    return {
      status: "cloud",
      attempt: {
        ...toSavedBehavioralAttempt(record, userId),
        id: answerRef.id,
      },
    }
  } catch (error) {
    const err = error as { code?: string; message?: string }
    console.error("Firestore save failed:", JSON.stringify(error))
    console.error("[save] Firestore error code:", err.code)
    console.error("[save] Firestore error message:", err.message)
    throw error
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
