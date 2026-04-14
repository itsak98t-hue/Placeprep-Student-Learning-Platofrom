import { doc, getDoc, increment, setDoc, serverTimestamp } from "firebase/firestore"

import { db } from "@/lib/firebase"

const PLATFORM_STATS_ID = "global"

function platformStatsRef() {
  return doc(db, "platform_stats", PLATFORM_STATS_ID)
}

export async function incrementPlatformUserCount() {
  await setDoc(
    platformStatsRef(),
    {
      totalUsers: increment(1),
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  )
}

export async function updatePlatformAnswerStats(totalAnswersDelta: number, answers: Array<{ score: number }>) {
  if (totalAnswersDelta <= 0 || answers.length === 0) {
    return
  }

  const snapshot = await getDoc(platformStatsRef())
  const previousTotalAnswers = Number(snapshot.data()?.totalAnswers ?? 0)
  const previousAverage = Number(snapshot.data()?.avgPlatformScore ?? 0)
  const previousScoreTotal = previousAverage * previousTotalAnswers
  const addedScoreTotal = answers.reduce((sum, answer) => sum + answer.score, 0)
  const nextTotalAnswers = previousTotalAnswers + totalAnswersDelta
  const nextAverage = nextTotalAnswers > 0 ? (previousScoreTotal + addedScoreTotal) / nextTotalAnswers : 0

  await setDoc(
    platformStatsRef(),
    {
      totalAnswers: increment(totalAnswersDelta),
      avgPlatformScore: Number(nextAverage.toFixed(2)),
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  )
}
