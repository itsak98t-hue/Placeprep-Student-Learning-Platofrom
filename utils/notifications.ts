import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { NotificationDoc, NotificationType } from "@/types/dashboard"

function notificationCollection(uid: string) {
  return collection(db, "users", uid, "notifications")
}

function notificationDoc(uid: string, id: string) {
  return doc(db, "users", uid, "notifications", id)
}

function sanitizeId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export async function createNotification(
  uid: string,
  type: NotificationType,
  title: string,
  message: string,
  id?: string
) {
  if (!uid) {
    return null
  }

  const nextId = id ?? `${type}-${sanitizeId(title)}-${Date.now()}`

  await setDoc(
    notificationDoc(uid, nextId),
    {
      id: nextId,
      type,
      title,
      message,
      read: false,
      createdAt: serverTimestamp(),
    } satisfies Omit<NotificationDoc, "createdAt"> & { createdAt: ReturnType<typeof serverTimestamp> },
    { merge: true }
  )

  return nextId
}

export async function createReminderNotification(uid: string) {
  const reminderId = `reminder-${new Date().toISOString().split("T")[0]}`
  return createNotification(
    uid,
    "reminder",
    "📚 Don't break your streak!",
    "You have been inactive for 2 days. Jump back into a practice session to keep momentum.",
    reminderId
  )
}

export async function markNotificationRead(uid: string, notificationId: string) {
  await updateDoc(notificationDoc(uid, notificationId), {
    read: true,
  })
}

export async function maybeCreateTopLeaderboardNotification(uid: string) {
  const leaderboardSnapshot = await getDocs(
    query(collection(db, "leaderboard"), orderBy("rankScore", "desc"), limit(10))
  )
  const isTopTen = leaderboardSnapshot.docs.some((entry) => entry.id === uid)
  if (!isTopTen) {
    return
  }

  await createNotification(
    uid,
    "leaderboard",
    "⭐ You're in the Top 10!",
    "Your latest session pushed you into the top 10 on the leaderboard. Keep the streak going."
  )
}
