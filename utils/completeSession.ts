import { Timestamp, collection, doc, serverTimestamp, writeBatch } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { UserAnswer } from "@/types/answers"
import { updateLeaderboard } from "@/utils/updateLeaderboard"
import { updateStreak } from "@/utils/updateStreak"

type SessionAnswerInput = Omit<UserAnswer, "id" | "uid" | "createdAt" | "answeredAt" | "sessionId">

export async function completeSession(
  uid: string,
  sessionAnswers: SessionAnswerInput[],
  allPreviousAnswers: UserAnswer[]
) {
  const batch = writeBatch(db)
  const sessionId = crypto.randomUUID()
  const answerCollection = collection(db, "answers")
  const timestamp = serverTimestamp()

  for (const answer of sessionAnswers) {
    const ref = doc(answerCollection)
    batch.set(ref, {
      ...answer,
      uid,
      createdAt: timestamp,
      answeredAt: timestamp,
      sessionId,
    })
  }

  await batch.commit()

  const newStreak = await updateStreak(uid)
  const timestampNow = Timestamp.now()
  const normalizedAnswers: UserAnswer[] = sessionAnswers.map((answer, index) => ({
    ...answer,
    id: `${sessionId}-${index}`,
    uid,
    createdAt: timestampNow.toDate().toISOString(),
    answeredAt: timestampNow.toDate().toISOString(),
    sessionId,
  }))

  await updateLeaderboard(uid, [...allPreviousAnswers, ...normalizedAnswers], newStreak)

  return {
    sessionId,
    newStreak,
    answers: normalizedAnswers,
  }
}

