"use client"

import { useEffect, useState } from "react"
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { TOPIC_GUIDE_MODEL } from "@/lib/groq"

export function useTopicGuide(uid: string | null | undefined, courseId: string, topicId: string) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) {
      setContent(null)
      setError(null)
      return
    }

    const docId = `${uid}_${courseId}_${topicId}`
    const unsubscribe = onSnapshot(doc(db, "ai_feedback", docId), (snap) => {
      if (snap.exists()) {
        setContent(String(snap.data().content ?? ""))
        setError(null)
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
    setError(null)
    try {
      const cacheId = `${uid}_${courseId}_${topicId}`
      const cacheRef = doc(db, "ai_feedback", cacheId)
      const cacheSnap = await getDoc(cacheRef)
      if (cacheSnap.exists()) {
        setContent(String(cacheSnap.data().content ?? ""))
        return
      }

      console.log("[guide] calling API with:", { courseId, topicId, uid })
      const response = await fetch("/api/resources/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, topicId, uid }),
      })

      const data = (await response.json()) as { content?: string; model?: string; error?: string }
      console.log("[guide] response:", response.status, data)

      if (!response.ok) {
        throw new Error(data.error ?? "Failed")
      }

      const content = String(data.content ?? "").trim()
      if (!content) {
        throw new Error("Guide generation failed")
      }

      await setDoc(cacheRef, {
        uid,
        courseId,
        topicId,
        content,
        generatedAt: serverTimestamp(),
        model: data.model ?? TOPIC_GUIDE_MODEL,
      })

      setContent(content)
    } catch (fetchError) {
      console.error("[guide] error:", fetchError)
      setError("Guide generation failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return { content, loading, error, fetchOrGenerate }
}
