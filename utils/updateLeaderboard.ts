import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { UserAnswer } from "@/types/answers"
import { computeAnalytics } from "@/utils/computeAnalytics"

export async function updateLeaderboard(uid: string, allAnswers: UserAnswer[], streak: number) {
  const analytics = computeAnalytics(allAnswers)
  const rankScore = Math.round(
    analytics.avgScore * 0.5 + streak * 10 + analytics.problemsSolved * 0.3
  )

  const userDoc = await getDoc(doc(db, "users", uid))
  const userData = userDoc.data()

  await setDoc(
    doc(db, "leaderboard", uid),
    {
      uid,
      displayName: userData?.displayName ?? "Anonymous",
      photoURL: userData?.photoURL ?? null,
      tier: userData?.tier ?? "Tier 1",
      avgScore: analytics.avgScore,
      streak,
      problemsSolved: analytics.problemsSolved,
      rankScore,
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  )
}

