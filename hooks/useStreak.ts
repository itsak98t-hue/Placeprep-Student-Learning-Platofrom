"use client"

import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"

import { db } from "@/lib/firebase"

export function useStreak(uid: string | null | undefined) {
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setStreak(0)
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(doc(db, "users", uid), (snapshot) => {
      setStreak(Number(snapshot.data()?.streak ?? 0))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [uid])

  return { streak, loading }
}

