import {
  Timestamp,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import {
  getUserResumes as getFirestoreResumes,
  saveResume as saveFirestoreResume,
} from "@/lib/firestore/resumeService"
import { completeSession } from "@/utils/completeSession"
import type { AIFeedback, UserAnswer, SaveAnswerResult, StoredAnswerType, AnswerCategory } from "@/types/answers"
import type { Resume, ResumeInput, ResumeListItem } from "@/types/resume"

const LOCAL_ANSWERS_STORAGE_KEY = "placeprep_user_answers"

type StoredAnswerDocument = {
  type: StoredAnswerType
  questionId?: string | null
  question: string
  questionText?: string
  answer: string
  rating: number
  score?: number
  feedback: string
  company: string
  category: AnswerCategory
  topic?: string | null
  difficulty?: string | null
  isCorrect?: boolean | null
  timeTakenSeconds?: number | null
  aiFeedback: AIFeedback
  companySlug?: string | null
  behavioralCategory?: string | null
  label?: string | null
  displayLabel?: string | null
  confidence?: number | null
  scoreClarity?: number | null
  scoreStructure?: number | null
  scoreImpact?: number | null
  missing?: string[]
  suggestedImprovement?: string | null
  interpretation?: string | null
  status?: string | null
  timeSpentMin?: number | null
  hintsUsed?: number | null
  uid?: string | null
  courseId?: string | null
  topicId?: string | null
  sessionId?: string | null
  answeredAt?: Timestamp | null
  createdAt?: Timestamp | null
  createdAtMs: number
}

type GetAnswersOptions = {
  type?: StoredAnswerType
  limitCount?: number
}

function answersCollectionRef(userId: string) {
  return collection(db, "answers")
}

function toIsoString(value: Timestamp | null | undefined, fallbackMs: number): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  return new Date(fallbackMs).toISOString()
}

function normalizeAnswer(id: string, data: StoredAnswerDocument): UserAnswer {
  const normalizedCategory: AnswerCategory =
    data.category ??
    (data.type === "behavioral"
      ? "behavioral"
      : data.type === "coding"
        ? "coding"
        : "technical")

  return {
    id,
    type: data.type,
    questionId: data.questionId ?? null,
    question: data.question,
    questionText: data.questionText ?? data.question,
    answer: data.answer,
    rating: data.rating,
    score: typeof data.score === "number" ? data.score : data.rating,
    feedback: data.feedback,
    company: data.company,
    category: normalizedCategory,
    topic: data.topic ?? null,
    difficulty: data.difficulty ?? null,
    isCorrect: typeof data.isCorrect === "boolean" ? data.isCorrect : null,
    timeTakenSeconds: typeof data.timeTakenSeconds === "number" ? data.timeTakenSeconds : null,
    createdAt: toIsoString(data.answeredAt ?? data.createdAt, data.createdAtMs),
    answeredAt: toIsoString(data.answeredAt ?? data.createdAt, data.createdAtMs),
    uid: typeof data.uid === "string" ? data.uid : null,
    courseId: typeof data.courseId === "string" ? data.courseId : null,
    topicId: typeof data.topicId === "string" ? data.topicId : null,
    sessionId: typeof data.sessionId === "string" ? data.sessionId : null,
    aiFeedback: {
      strengths: Array.isArray(data.aiFeedback?.strengths) ? data.aiFeedback.strengths : [],
      improvements: Array.isArray(data.aiFeedback?.improvements) ? data.aiFeedback.improvements : [],
      suggestions: Array.isArray(data.aiFeedback?.suggestions) ? data.aiFeedback.suggestions : [],
      ratingExplanation: data.aiFeedback?.ratingExplanation ?? data.feedback,
    },
    companySlug: data.companySlug ?? null,
    behavioralCategory: (data.behavioralCategory as UserAnswer["behavioralCategory"]) ?? null,
    label: (data.label as UserAnswer["label"]) ?? undefined,
    displayLabel: (data.displayLabel as UserAnswer["displayLabel"]) ?? undefined,
    confidence: typeof data.confidence === "number" ? data.confidence : undefined,
    scoreClarity: typeof data.scoreClarity === "number" ? data.scoreClarity : undefined,
    scoreStructure: typeof data.scoreStructure === "number" ? data.scoreStructure : undefined,
    scoreImpact: typeof data.scoreImpact === "number" ? data.scoreImpact : undefined,
    missing: Array.isArray(data.missing) ? data.missing : [],
    suggestedImprovement: data.suggestedImprovement ?? undefined,
    interpretation: data.interpretation ?? undefined,
    status: (data.status as UserAnswer["status"]) ?? undefined,
    timeSpentMin: typeof data.timeSpentMin === "number" ? data.timeSpentMin : undefined,
    hintsUsed: typeof data.hintsUsed === "number" ? data.hintsUsed : undefined,
  }
}

function toAnswerDocument(answer: UserAnswer): StoredAnswerDocument {
  const createdAtMs = new Date(answer.createdAt).getTime() || Date.now()
  const normalizedAiFeedback: AIFeedback = {
    strengths: Array.isArray(answer.aiFeedback?.strengths) ? answer.aiFeedback.strengths : [],
    improvements: Array.isArray(answer.aiFeedback?.improvements) ? answer.aiFeedback.improvements : [],
    suggestions: Array.isArray(answer.aiFeedback?.suggestions) ? answer.aiFeedback.suggestions : [],
    ratingExplanation: answer.aiFeedback?.ratingExplanation ?? answer.feedback,
  }

  return {
    type: answer.type,
    questionId: answer.questionId ?? null,
    question: answer.question,
    questionText: answer.questionText ?? answer.question,
    answer: answer.answer,
    rating: answer.rating,
    score: answer.score ?? answer.rating,
    feedback: answer.feedback,
    company: answer.company,
    category: answer.category,
    topic: answer.topic ?? null,
    difficulty: answer.difficulty ?? null,
    isCorrect: typeof answer.isCorrect === "boolean" ? answer.isCorrect : null,
    timeTakenSeconds: answer.timeTakenSeconds ?? null,
    aiFeedback: normalizedAiFeedback,
    companySlug: answer.companySlug ?? null,
    behavioralCategory: answer.behavioralCategory ?? null,
    label: answer.label ?? null,
    displayLabel: answer.displayLabel ?? null,
    confidence: answer.confidence ?? null,
    scoreClarity: answer.scoreClarity ?? null,
    scoreStructure: answer.scoreStructure ?? null,
    scoreImpact: answer.scoreImpact ?? null,
    missing: Array.isArray(answer.missing) ? answer.missing : [],
    suggestedImprovement: answer.suggestedImprovement ?? null,
    interpretation: answer.interpretation ?? null,
    status: answer.status ?? null,
    timeSpentMin: answer.timeSpentMin ?? null,
    hintsUsed: answer.hintsUsed ?? null,
    uid: answer.uid ?? null,
    courseId: answer.courseId ?? null,
    topicId: answer.topicId ?? null,
    sessionId: answer.sessionId ?? null,
    createdAtMs,
  }
}

function inferCourseId(answer: UserAnswer): string {
  if (answer.courseId) {
    return answer.courseId
  }

  if (answer.category === "aptitude") {
    return "aptitude"
  }

  if (answer.category === "behavioral" || answer.category === "hr" || answer.type === "behavioral") {
    return "behavioral_hr"
  }

  const topic = answer.topic?.toLowerCase() ?? ""
  if (topic.includes("db") || topic.includes("sql")) return "dbms"
  if (topic.includes("network")) return "cn"
  if (topic.includes("system")) return "system_design"
  if (topic.includes("os") || topic.includes("thread") || topic.includes("process")) return "os"
  if (topic.includes("oop") || topic.includes("object")) return "oops"
  return "dsa"
}

function inferTopicId(answer: UserAnswer): string {
  if (answer.topicId) {
    return answer.topicId
  }

  return (
    answer.topic?.trim().toLowerCase().replace(/\s+/g, "-") ||
    answer.behavioralCategory?.trim().toLowerCase().replace(/\s+/g, "-") ||
    answer.questionId ||
    "general"
  )
}

function getLocalAnswers(): UserAnswer[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_ANSWERS_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item): item is UserAnswer => {
      return Boolean(
        item &&
        typeof item === "object" &&
        typeof (item as UserAnswer).type === "string" &&
        typeof (item as UserAnswer).question === "string" &&
        typeof (item as UserAnswer).createdAt === "string"
      )
    })
  } catch {
    return []
  }
}

function saveLocalAnswers(answers: UserAnswer[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(LOCAL_ANSWERS_STORAGE_KEY, JSON.stringify(answers))
}

function saveAnswerLocally(answer: UserAnswer): UserAnswer {
  const savedAnswer: UserAnswer = {
    ...answer,
    id: answer.id ?? `local-${Date.now()}-${answer.type}`,
    createdAt: answer.createdAt || new Date().toISOString(),
  }

  const nextAnswers = [savedAnswer, ...getLocalAnswers()]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 50)

  saveLocalAnswers(nextAnswers)
  return savedAnswer
}

function filterAnswers(answers: UserAnswer[], options?: GetAnswersOptions) {
  const filtered = options?.type
    ? answers.filter((answer) => answer.type === options.type)
    : answers

  return filtered
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, options?.limitCount ?? filtered.length)
}

export async function saveResume(userId: string, resumeData: Resume | ResumeInput): Promise<Resume> {
  return saveFirestoreResume(userId, resumeData as Resume)
}

export async function getResumes(userId: string): Promise<ResumeListItem[]> {
  return getFirestoreResumes(userId)
}

export async function saveAnswer(userId: string | null | undefined, answerData: UserAnswer): Promise<SaveAnswerResult> {
  const preparedAnswer: UserAnswer = {
    ...answerData,
    uid: userId ?? null,
    createdAt: answerData.createdAt || new Date().toISOString(),
    answeredAt: answerData.answeredAt || answerData.createdAt || new Date().toISOString(),
    questionText: answerData.questionText || answerData.question,
    score: answerData.score ?? answerData.rating,
    category: answerData.category,
    questionId: answerData.questionId ?? answerData.question,
    courseId: inferCourseId(answerData),
    topicId: inferTopicId(answerData),
    missing: Array.isArray(answerData.missing) ? answerData.missing : [],
    aiFeedback: {
      strengths: Array.isArray(answerData.aiFeedback?.strengths) ? answerData.aiFeedback.strengths : [],
      improvements: Array.isArray(answerData.aiFeedback?.improvements) ? answerData.aiFeedback.improvements : [],
      suggestions: Array.isArray(answerData.aiFeedback?.suggestions) ? answerData.aiFeedback.suggestions : [],
      ratingExplanation: answerData.aiFeedback?.ratingExplanation ?? answerData.feedback,
    },
  }

  if (!userId) {
    return {
      status: "local",
      answer: saveAnswerLocally(preparedAnswer),
    }
  }

  try {
    console.log("Saving for user:", userId)
    const previousAnswers = await getAnswers(userId)
    const result = await completeSession(userId, [preparedAnswer], previousAnswers)
    const savedAnswer = result.answers[0]

    return {
      status: "cloud",
      answer: savedAnswer,
    }
  } catch (error) {
    console.error("Firestore saveAnswer failed:", {
      userId,
      type: preparedAnswer.type,
      questionId: preparedAnswer.questionId ?? null,
      error,
    })

    return {
      status: "local",
      answer: saveAnswerLocally(preparedAnswer),
    }
  }
}

export async function getAnswers(
  userId: string | null | undefined,
  options?: GetAnswersOptions
): Promise<UserAnswer[]> {
  if (!userId) {
    return filterAnswers(getLocalAnswers(), options)
  }

  try {
    const snapshot = await getDocs(
      query(answersCollectionRef(userId), where("uid", "==", userId), orderBy("answeredAt", "desc"))
    )

    return filterAnswers(
      snapshot.docs.map((doc) => normalizeAnswer(doc.id, doc.data() as StoredAnswerDocument)),
      options
    )
  } catch (error) {
    console.error("Firestore getAnswers failed:", {
      userId,
      type: options?.type ?? null,
      error,
    })

    return filterAnswers(getLocalAnswers(), options)
  }
}
