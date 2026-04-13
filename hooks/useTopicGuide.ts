"use client"

import { useEffect, useState } from "react"
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { TOPIC_GUIDE_MODEL, generateTopicGuide } from "@/lib/groq"

export function useTopicGuide(uid: string | null | undefined, courseId: string, topicId: string) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!uid) {
      setContent(null)
      return
    }

    const docId = `${uid}_${courseId}_${topicId}`
    const unsubscribe = onSnapshot(doc(db, "ai_feedback", docId), (snap) => {
      if (snap.exists()) {
        setContent(String(snap.data().content ?? ""))
      } else {
        setContent(null)
      }
    })

    return () => unsubscribe()
  }, [courseId, topicId, uid])

  async function fetchOrGenerate() {
    if (!uid) {
      return
    }

    setLoading(true)
    const docId = `${uid}_${courseId}_${topicId}`
    const ref = doc(db, "ai_feedback", docId)
    const snap = await getDoc(ref)

    if (snap.exists()) {
      setContent(String(snap.data().content ?? ""))
      setLoading(false)
      return
    }

    const courseSnap = await getDoc(doc(db, "courses", courseId))
    const courseLabel = String(courseSnap.data()?.label ?? courseId)
    const generated = await generateTopicGuide(courseLabel, topicId)

    await setDoc(ref, {
      uid,
      courseId,
      topicId,
      content: generated,
      generatedAt: serverTimestamp(),
      model: TOPIC_GUIDE_MODEL,
    })

    setContent(generated)
    setLoading(false)
  }

  return { content, loading, fetchOrGenerate }
}
