import { Timestamp, collection, doc, getDoc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { UserAnswer } from "@/types/answers"
import { computeAchievements, getUnlockedAchievementIds } from "@/utils/achievements"
import { computeAnalytics } from "@/utils/computeAnalytics"
import { createNotification, maybeCreateTopLeaderboardNotification } from "@/utils/notifications"
import { updatePlatformAnswerStats } from "@/utils/platform-stats"
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
    const userScopedRef = doc(db, "users", uid, "answers", ref.id)
    const payload = {
      ...answer,
      uid,
      createdAt: timestamp,
      answeredAt: timestamp,
      sessionId,
    }
    batch.set(ref, {
      ...payload,
    })
    batch.set(userScopedRef, payload)
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

  const allAnswers = [...allPreviousAnswers, ...normalizedAnswers]
  const analytics = computeAnalytics(allAnswers)

  await updateLeaderboard(uid, allAnswers, newStreak)
  await updatePlatformAnswerStats(
    normalizedAnswers.length,
    normalizedAnswers.map((answer) => ({ score: answer.score ?? answer.rating }))
  )

  const userDocRef = doc(db, "users", uid)
  const userDoc = await getDoc(userDocRef)
  const storedAchievements = Array.isArray(userDoc.data()?.achievements)
    ? (userDoc.data()?.achievements as string[])
    : []
  const achievements = computeAchievements(analytics, newStreak, allAnswers.length, storedAchievements)
  const unlockedIds = getUnlockedAchievementIds(achievements)
  const newAchievementIds = unlockedIds.filter((id) => !storedAchievements.includes(id))

  await setDoc(
    userDocRef,
    {
      achievements: unlockedIds,
      problemsSolved: analytics.problemsSolved,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

  for (const achievementId of newAchievementIds) {
    const achievement = achievements.find((item) => item.id === achievementId)
    if (!achievement) {
      continue
    }
    await createNotification(
      uid,
      "achievement",
      `🏆 Achievement Unlocked: ${achievement.title}!`,
      achievement.description
    )
  }

  await createNotification(
    uid,
    "streak",
    `🔥 Day ${newStreak} Streak! Keep going!`,
    "Your consistency is paying off. Complete another session tomorrow to keep the streak alive."
  )
  await maybeCreateTopLeaderboardNotification(uid)

  return {
    sessionId,
    newStreak,
    answers: normalizedAnswers,
  }
}
