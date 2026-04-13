import {
  Timestamp,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import type { User } from "firebase/auth"

import { db } from "@/lib/firebase"
import {
  computeCourseStatus,
  computeStreakFromDates,
  computeTopicsCovered,
  computeWeightedAccuracy,
  mean,
  normalizeScoreToPercent,
} from "@/lib/learning-analytics"
import type { UserAnswer } from "@/types/answers"
import type {
  CourseConfig,
  FirestoreCompany,
  LeaderboardEntry,
  UserProgressRecord,
  UserSessionRecord,
} from "@/types/learning"

function timestampToIso(value: Timestamp | null | undefined) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  return null
}

function subscribeCollection<T>(
  collectionPath: string,
  onData: (items: T[]) => void,
  mapDoc: (id: string, data: Record<string, unknown>) => T
) {
  const ref = collection(db, collectionPath)
  return onSnapshot(ref, (snapshot) => {
    onData(snapshot.docs.map((item) => mapDoc(item.id, item.data() as Record<string, unknown>)))
  })
}

export function subscribeToCourses(onData: (courses: CourseConfig[]) => void) {
  return subscribeCollection<CourseConfig>(
    "courses",
    onData,
    (id, data) => ({
      id: String(data.id ?? id),
      label: String(data.label ?? id.toUpperCase()),
      totalTopics: Number(data.totalTopics ?? 0),
      icon: String(data.icon ?? "book-open"),
      topics: Array.isArray(data.topics) ? data.topics.map((topic) => String(topic)) : [],
    })
  )
}

export function subscribeToCompanies(onData: (companies: FirestoreCompany[]) => void) {
  return subscribeCollection<FirestoreCompany>(
    "companies",
    onData,
    (id, data) => ({
      id: String(data.id ?? id),
      name: String(data.name ?? id),
      logo: String(data.logo ?? ""),
      requiredCourses: Array.isArray(data.requiredCourses)
        ? data.requiredCourses.map((course) => String(course))
        : [],
      focusAreas: Array.isArray(data.focusAreas) ? data.focusAreas.map((item) => String(item)) : [],
      difficulty:
        data.difficulty === "easy" || data.difficulty === "medium" || data.difficulty === "hard"
          ? data.difficulty
          : "medium",
      avgPackageLPA: Number(data.avgPackageLPA ?? 0),
      openRoles: Array.isArray(data.openRoles) ? data.openRoles.map((role) => String(role)) : [],
      tips: String(data.tips ?? ""),
    })
  )
}

export function subscribeToLeaderboard(onData: (entries: LeaderboardEntry[]) => void) {
  return subscribeCollection<LeaderboardEntry>(
    "leaderboard",
    onData,
    (_id, data) => ({
      uid: String(data.uid ?? ""),
      displayName: String(data.displayName ?? "Student"),
      tier: String(data.tier ?? "Tier 2"),
      avgScore: Number(data.avgScore ?? 0),
      totalScore: Number(data.totalScore ?? 0),
      avgAccuracy: Number(data.avgAccuracy ?? 0),
      streak: Number(data.streak ?? 0),
      topicsCovered: Number(data.topicsCovered ?? 0),
      lastUpdated: timestampToIso(data.lastUpdated as Timestamp | undefined),
    })
  )
}

export function subscribeToUserProgress(uid: string, onData: (records: Record<string, UserProgressRecord>) => void) {
  return onSnapshot(collection(db, "users", uid, "progress"), (snapshot) => {
    const items = snapshot.docs.map((item) => {
      const data = item.data() as Record<string, unknown>
      const topicsCompleted = Array.isArray(data.topicsCompleted)
        ? data.topicsCompleted.map((topic) => String(topic))
        : []
      const scores = Array.isArray(data.scores)
        ? data.scores.map((score) => Number(score)).filter((score) => Number.isFinite(score))
        : []
      const totalTopics = Number(data.totalTopics ?? 0)

      return {
        courseId: String(data.courseId ?? item.id),
        topicsCompleted,
        totalTopics,
        scores,
        lastUpdated: timestampToIso(data.lastUpdated as Timestamp | undefined),
        status: computeCourseStatus(scores, topicsCompleted.length, totalTopics),
      }
    })
    const mapped = items.reduce<Record<string, UserProgressRecord>>((accumulator, item) => {
      accumulator[item.courseId] = item
      return accumulator
    }, {})

    onData(mapped)
  })
}

export function subscribeToUserSessions(uid: string, onData: (records: UserSessionRecord[]) => void) {
  return onSnapshot(collection(db, "users", uid, "sessions"), (snapshot) => {
    const sorted = snapshot.docs
      .map((item) => {
        const data = item.data() as Record<string, unknown>
        return {
          id: item.id,
          courseId: String(data.courseId ?? "behavioral_hr"),
          topicId: String(data.topicId ?? "general"),
          score: Number(data.score ?? 0),
          correctAnswers: Number(data.correctAnswers ?? 0),
          totalQuestions: Number(data.totalQuestions ?? 0),
          timeTakenSeconds: Number(data.timeTakenSeconds ?? 0),
          completedAt: timestampToIso(data.completedAt as Timestamp | undefined) ?? new Date().toISOString(),
          aiFeedback: String(data.aiFeedback ?? ""),
          aiFeedbackStoredAt: timestampToIso(data.aiFeedbackStoredAt as Timestamp | undefined),
        }
      })
      .sort((left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime())

    onData(sorted)
  })
}

export function subscribeToUserDoc(
  uid: string,
  onData: (data: { streak: number; lastActiveDate: string | null; displayName: string; tier: string } | null) => void
) {
  return onSnapshot(doc(db, "users", uid), (snapshot) => {
    if (!snapshot.exists()) {
      onData(null)
      return
    }

    const data = snapshot.data()
    onData({
      streak: Number(data.streak ?? 0),
      lastActiveDate: typeof data.lastActiveDate === "string" ? data.lastActiveDate : null,
      displayName: String(data.displayName ?? data.name ?? "Student"),
      tier: String(data.tier ?? "Tier 2"),
    })
  })
}

function inferCourseId(answer: UserAnswer) {
  if (answer.category === "aptitude") {
    return "aptitude"
  }

  if (answer.category === "behavioral" || answer.category === "hr" || answer.type === "behavioral") {
    return "behavioral_hr"
  }

  const topic = answer.topic?.toLowerCase() ?? ""

  if (topic.includes("system")) {
    return "system_design"
  }

  if (topic.includes("db") || topic.includes("sql")) {
    return "dbms"
  }

  if (topic.includes("network")) {
    return "cn"
  }

  if (topic.includes("os") || topic.includes("thread") || topic.includes("process")) {
    return "os"
  }

  if (topic.includes("oop") || topic.includes("object")) {
    return "oops"
  }

  return "dsa"
}

function inferTopicId(answer: UserAnswer) {
  return (
    answer.topic?.trim().toLowerCase().replace(/\s+/g, "-") ||
    answer.behavioralCategory?.trim().toLowerCase().replace(/\s+/g, "-") ||
    answer.questionId ||
    "general"
  )
}

function buildSessionFromAnswer(answerId: string, answer: UserAnswer): Omit<UserSessionRecord, "id"> {
  const score = typeof answer.score === "number" ? answer.score : answer.rating
  const normalizedScore = score <= 10 ? score : Math.round(score / 10)

  return {
    courseId: inferCourseId(answer),
    topicId: inferTopicId(answer),
    score: normalizedScore,
    correctAnswers:
      typeof answer.isCorrect === "boolean"
        ? answer.isCorrect
          ? 1
          : 0
        : Math.max(0, Math.round(normalizedScore)),
    totalQuestions: typeof answer.isCorrect === "boolean" ? 1 : 10,
    timeTakenSeconds: answer.timeTakenSeconds ?? 0,
    completedAt: answer.createdAt,
    aiFeedback: answer.aiFeedback.ratingExplanation ?? answer.feedback,
    aiFeedbackStoredAt: answer.createdAt,
  }
}

async function upsertProgressFromSession(uid: string, session: Omit<UserSessionRecord, "id">) {
  const progressRef = doc(db, "users", uid, "progress", session.courseId)
  const progressSnap = await getDoc(progressRef)
  const existing = progressSnap.exists() ? progressSnap.data() : null
  const existingTopics = Array.isArray(existing?.topicsCompleted)
    ? existing.topicsCompleted.map((topic: unknown) => String(topic))
    : []
  const existingScores = Array.isArray(existing?.scores)
    ? existing.scores.map((score: unknown) => Number(score)).filter((score: number) => Number.isFinite(score))
    : []
  const nextTopics = existingTopics.includes(session.topicId)
    ? existingTopics
    : [...existingTopics, session.topicId]
  const nextScores = [...existingScores, session.score]
  const totalTopics = Number(existing?.totalTopics ?? 0)

  await setDoc(
    progressRef,
    {
      courseId: session.courseId,
      topicsCompleted: nextTopics,
      totalTopics,
      scores: nextScores,
      lastUpdated: serverTimestamp(),
      status: computeCourseStatus(nextScores, nextTopics.length, totalTopics),
    },
    { merge: true }
  )

  return {
    topicsCompleted: nextTopics,
    scores: nextScores,
    totalTopics,
  }
}

async function updateStreak(uid: string) {
  const userRef = doc(db, "users", uid)
  const snap = await getDoc(userRef)
  const data = snap.exists() ? snap.data() : {}
  const today = new Date().toISOString().split("T")[0]
  const last = typeof data.lastActiveDate === "string" ? data.lastActiveDate : null
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayString = yesterday.toISOString().split("T")[0]

  if (last === today) {
    return Number(data.streak ?? 0)
  }

  const nextStreak = last === yesterdayString ? Number(data.streak ?? 0) + 1 : 1

  await setDoc(
    userRef,
    {
      streak: nextStreak,
      lastActiveDate: today,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

  return nextStreak
}

export async function recordLearningAnalytics(
  uid: string,
  answerId: string,
  answer: UserAnswer,
  user?: Pick<User, "displayName" | "email"> | null
) {
  const session = buildSessionFromAnswer(answerId, answer)
  const sessionRef = doc(db, "users", uid, "sessions", answerId)

  await setDoc(
    sessionRef,
    {
      ...session,
      completedAt: serverTimestamp(),
      aiFeedbackStoredAt: serverTimestamp(),
    },
    { merge: true }
  )

  await setDoc(
    doc(db, "ai_feedback", `${uid}_${session.courseId}_${session.topicId}`),
    {
      uid,
      courseId: session.courseId,
      topicId: session.topicId,
      feedback: session.aiFeedback,
      generatedAt: serverTimestamp(),
      model: "groq",
    },
    { merge: true }
  )

  await upsertProgressFromSession(uid, session)
  const streak = await updateStreak(uid)

  const sessionsSnap = await getDoc(doc(db, "users", uid))
  const userData = sessionsSnap.exists() ? sessionsSnap.data() : {}
  const progressCollectionUnsubPromise = new Promise<Record<string, UserProgressRecord>>((resolve) => {
    const unsub = onSnapshot(collection(db, "users", uid, "progress"), (snapshot) => {
      unsub()
      resolve(
        snapshot.docs.reduce<Record<string, UserProgressRecord>>((accumulator, item) => {
          const data = item.data()
          const topicsCompleted = Array.isArray(data.topicsCompleted)
            ? data.topicsCompleted.map((topic: unknown) => String(topic))
            : []
          const scores = Array.isArray(data.scores)
            ? data.scores.map((score: unknown) => Number(score)).filter((score: number) => Number.isFinite(score))
            : []

          accumulator[item.id] = {
            courseId: String(data.courseId ?? item.id),
            topicsCompleted,
            totalTopics: Number(data.totalTopics ?? 0),
            scores,
            lastUpdated: timestampToIso(data.lastUpdated as Timestamp | undefined),
            status: computeCourseStatus(scores, topicsCompleted.length, Number(data.totalTopics ?? 0)),
          }

          return accumulator
        }, {})
      )
    })
  })

  const sessionCollectionUnsubPromise = new Promise<UserSessionRecord[]>((resolve) => {
    const unsub = onSnapshot(collection(db, "users", uid, "sessions"), (snapshot) => {
      unsub()
      resolve(
        snapshot.docs.map((item) => {
          const data = item.data()
          return {
            id: item.id,
            courseId: String(data.courseId ?? "behavioral_hr"),
            topicId: String(data.topicId ?? "general"),
            score: Number(data.score ?? 0),
            correctAnswers: Number(data.correctAnswers ?? 0),
            totalQuestions: Number(data.totalQuestions ?? 0),
            timeTakenSeconds: Number(data.timeTakenSeconds ?? 0),
            completedAt: timestampToIso(data.completedAt as Timestamp | undefined) ?? new Date().toISOString(),
            aiFeedback: String(data.aiFeedback ?? ""),
            aiFeedbackStoredAt: timestampToIso(data.aiFeedbackStoredAt as Timestamp | undefined),
          }
        })
      )
    })
  })

  const [progressMap, sessions] = await Promise.all([progressCollectionUnsubPromise, sessionCollectionUnsubPromise])
  const avgAccuracy = computeWeightedAccuracy(sessions)
  const topicsCovered = computeTopicsCovered(progressMap)

  await setDoc(
    doc(db, "leaderboard", uid),
    {
      uid,
      displayName: user?.displayName || String(userData.displayName ?? userData.name ?? "Student"),
      tier: String(userData.tier ?? "Tier 2"),
      totalScore: increment(normalizeScoreToPercent(session.score)),
      avgAccuracy,
      streak: computeStreakFromDates(String(userData.lastActiveDate ?? null), streak) || streak,
      topicsCovered,
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  )
}
