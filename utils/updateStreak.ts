import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"

export async function updateStreak(uid: string): Promise<number> {
  const userRef = doc(db, "users", uid)
  const snap = await getDoc(userRef)
  const data = snap.data() ?? {}

  const today = new Date().toISOString().split("T")[0]
  const lastActive = typeof data.lastActiveDate === "string" ? data.lastActiveDate : null

  if (lastActive === today) {
    return typeof data.streak === "number" ? data.streak : 1
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayString = yesterday.toISOString().split("T")[0]

  const newStreak = lastActive === yesterdayString ? (typeof data.streak === "number" ? data.streak : 0) + 1 : 1

  await updateDoc(userRef, {
    streak: newStreak,
    lastActiveDate: today,
    updatedAt: serverTimestamp(),
  })

  return newStreak
}

