"use client"

import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { UserDoc, UserSettings } from "@/types/dashboard"

const defaultSettings: UserSettings = {
  emailNotifications: false,
  darkMode: false,
  practiceReminders: false,
  weeklyReport: false,
}

function normalizeUserDoc(uid: string, data: Record<string, unknown> | undefined): UserDoc {
  return {
    uid,
    displayName: typeof data?.displayName === "string" ? data.displayName : "Student User",
    email: typeof data?.email === "string" ? data.email : "",
    photoURL: typeof data?.photoURL === "string" ? data.photoURL : null,
    tier:
      data?.tier === "Tier 1" || data?.tier === "Tier 2" || data?.tier === "Tier 3"
        ? data.tier
        : "Tier 2",
    streak: typeof data?.streak === "number" ? data.streak : 0,
    lastActiveDate: typeof data?.lastActiveDate === "string" ? data.lastActiveDate : "",
    createdAt: data?.createdAt as UserDoc["createdAt"],
    achievements: Array.isArray(data?.achievements)
      ? data.achievements.filter((achievement): achievement is string => typeof achievement === "string")
      : [],
    settings: {
      ...defaultSettings,
      ...(typeof data?.settings === "object" && data.settings ? (data.settings as Partial<UserSettings>) : {}),
    },
    interviewsCompleted:
      typeof data?.interviewsCompleted === "number" ? data.interviewsCompleted : 0,
    badges: typeof data?.badges === "number" ? data.badges : 0,
  }
}

export function useUserDocument(uid: string | null | undefined) {
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setUserDoc(null)
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(doc(db, "users", uid), (snapshot) => {
      setUserDoc(snapshot.exists() ? normalizeUserDoc(uid, snapshot.data() as Record<string, unknown>) : null)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [uid])

  return { userDoc, loading }
}

export { defaultSettings }
