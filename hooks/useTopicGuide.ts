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
      console.log("[guide] Starting generation for:", courseId, topicId)
      const docId = `${uid}_${courseId}_${topicId}`
      const ref = doc(db, "ai_feedback", docId)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        setContent(String(snap.data().content ?? ""))
        return
      }

      const response = await fetch("/api/resources/guide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          topicId,
          uid,
        }),
      })

      console.log("[guide] Response status:", response.status)
      if (!response.ok) {
        const apiError = await response.json()
        console.error("[guide] API error:", apiError)
        throw new Error(apiError?.error ?? "Guide generation failed")
      }

      const data = (await response.json()) as {
        content?: string
        feedback?: string
        model?: string
      }
      const generated = String(data.content ?? data.feedback ?? "").trim()
      if (!generated) {
        throw new Error("Guide generation failed")
      }

      await setDoc(ref, {
        uid,
        courseId,
        topicId,
        content: generated,
        generatedAt: serverTimestamp(),
        model: data.model ?? TOPIC_GUIDE_MODEL,
      })

      setContent(generated)
    } catch (fetchError) {
      console.error("[guide] Frontend error:", fetchError)
      setError("Guide generation failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return { content, loading, error, fetchOrGenerate }
}
