"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { UserAnswer } from "@/types/answers"
import { computeAnalytics, type UserAnalytics } from "@/utils/computeAnalytics"

export function useUserAnalytics(uid: string | null | undefined) {
  const [answers, setAnswers] = useState<UserAnswer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setAnswers([])
      setLoading(false)
      return
    }

    const answersQuery = query(
      collection(db, "answers"),
      where("uid", "==", uid),
      orderBy("answeredAt", "desc")
    )

    const unsubscribe = onSnapshot(answersQuery, (snapshot) => {
      setAnswers(
        snapshot.docs.map((doc) => {
          const data = doc.data()
          const answeredAt =
            typeof data.answeredAt?.toDate === "function"
              ? data.answeredAt.toDate().toISOString()
              : typeof data.createdAt?.toDate === "function"
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString()

          return {
            id: doc.id,
            uid: String(data.uid ?? uid),
            type: String(data.type ?? "coding") as UserAnswer["type"],
            questionId: String(data.questionId ?? ""),
            question: String(data.question ?? data.questionText ?? ""),
            questionText: String(data.questionText ?? data.question ?? ""),
            answer: String(data.answer ?? ""),
            rating: Number(data.score ?? data.rating ?? 0),
            score: Number(data.score ?? data.rating ?? 0),
            feedback: String(data.feedback ?? ""),
            company: String(data.company ?? ""),
            category: String(data.category ?? "coding") as UserAnswer["category"],
            topic: typeof data.topic === "string" ? data.topic : null,
            difficulty: typeof data.difficulty === "string" ? data.difficulty : null,
            isCorrect: typeof data.isCorrect === "boolean" ? data.isCorrect : null,
            timeTakenSeconds: Number(data.timeTakenSeconds ?? 0),
            createdAt: answeredAt,
            answeredAt,
            courseId: typeof data.courseId === "string" ? data.courseId : null,
            topicId: typeof data.topicId === "string" ? data.topicId : null,
            sessionId: typeof data.sessionId === "string" ? data.sessionId : null,
            aiFeedback: {
              strengths: Array.isArray(data.aiFeedback?.strengths) ? data.aiFeedback.strengths : [],
              improvements: Array.isArray(data.aiFeedback?.improvements) ? data.aiFeedback.improvements : [],
              suggestions: Array.isArray(data.aiFeedback?.suggestions) ? data.aiFeedback.suggestions : [],
              ratingExplanation: String(data.aiFeedback?.ratingExplanation ?? data.feedback ?? ""),
            },
          }
        })
      )
      setLoading(false)
    })

    return () => unsubscribe()
  }, [uid])

  const analytics: UserAnalytics = useMemo(() => computeAnalytics(answers), [answers])

  return { answers, analytics, loading }
}
