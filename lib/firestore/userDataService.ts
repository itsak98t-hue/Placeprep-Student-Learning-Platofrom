import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import {
  getUserResumes as getFirestoreResumes,
  saveResume as saveFirestoreResume,
} from "@/lib/firestore/resumeService"
import type { UserAnswer, SaveAnswerResult, StoredAnswerType } from "@/types/answers"
import type { Resume, ResumeInput, ResumeListItem } from "@/types/resume"

const LOCAL_ANSWERS_STORAGE_KEY = "placeprep_user_answers"

type StoredAnswerDocument = {
  type: StoredAnswerType
  question: string
  answer: string
  rating: number
  feedback: string
  company: string
  difficulty?: string | null
  questionId?: string | null
  companySlug?: string | null
  category?: string | null
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
  createdAt?: Timestamp | null
  createdAtMs: number
}

type GetAnswersOptions = {
  type?: StoredAnswerType
  limitCount?: number
}

function answersCollectionRef(userId: string) {
  return collection(db, "users", userId, "answers")
}

function toIsoString(value: Timestamp | null | undefined, fallbackMs: number): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  return new Date(fallbackMs).toISOString()
}

function normalizeAnswer(id: string, data: StoredAnswerDocument): UserAnswer {
  return {
    id,
    type: data.type,
    question: data.question,
    answer: data.answer,
    rating: data.rating,
    feedback: data.feedback,
    company: data.company,
    difficulty: data.difficulty ?? null,
    createdAt: toIsoString(data.createdAt, data.createdAtMs),
    questionId: data.questionId ?? null,
    companySlug: data.companySlug ?? null,
    category: (data.category as UserAnswer["category"]) ?? null,
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

  return {
    type: answer.type,
    question: answer.question,
    answer: answer.answer,
    rating: answer.rating,
    feedback: answer.feedback,
    company: answer.company,
    difficulty: answer.difficulty ?? null,
    questionId: answer.questionId ?? null,
    companySlug: answer.companySlug ?? null,
    category: answer.category ?? null,
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
    createdAt: serverTimestamp() as unknown as Timestamp,
    createdAtMs,
  }
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
    createdAt: answerData.createdAt || new Date().toISOString(),
    missing: Array.isArray(answerData.missing) ? answerData.missing : [],
  }

  if (!userId) {
    return {
      status: "local",
      answer: saveAnswerLocally(preparedAnswer),
    }
  }

  try {
    const payload = toAnswerDocument(preparedAnswer)
    console.log("Saving for user:", userId)
    const docRef = await addDoc(answersCollectionRef(userId), payload)

    return {
      status: "cloud",
      answer: normalizeAnswer(docRef.id, payload),
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
    const snapshot = await getDocs(query(answersCollectionRef(userId), orderBy("createdAtMs", "desc")))

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
