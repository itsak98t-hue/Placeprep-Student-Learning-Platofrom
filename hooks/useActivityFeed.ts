"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { UserAnswer } from "@/types/answers"

export type ActivityDay = {
  dateKey: string
  count: number
  averageScore: number
}

function toDateKey(input: string) {
  return input.slice(0, 10)
}

export function useActivityFeed(uid: string | null | undefined) {
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
        snapshot.docs.map((answerDoc) => {
          const data = answerDoc.data()
          const date = data.answeredAt?.toDate?.()?.toISOString?.() ?? data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString()
          return {
            id: answerDoc.id,
            uid: String(data.uid ?? uid),
            type: data.type,
            questionId: data.questionId ?? null,
            question: String(data.question ?? data.questionText ?? ""),
            questionText: String(data.questionText ?? data.question ?? ""),
            answer: String(data.answer ?? ""),
            rating: Number(data.rating ?? data.score ?? 0),
            score: Number(data.score ?? data.rating ?? 0),
            feedback: String(data.feedback ?? ""),
            company: String(data.company ?? ""),
            category: data.category,
            topic: typeof data.topic === "string" ? data.topic : null,
            difficulty: typeof data.difficulty === "string" ? data.difficulty : null,
            isCorrect: typeof data.isCorrect === "boolean" ? data.isCorrect : null,
            timeTakenSeconds: typeof data.timeTakenSeconds === "number" ? data.timeTakenSeconds : null,
            createdAt: date,
            answeredAt: date,
            courseId: typeof data.courseId === "string" ? data.courseId : null,
            topicId: typeof data.topicId === "string" ? data.topicId : null,
            sessionId: typeof data.sessionId === "string" ? data.sessionId : null,
            aiFeedback: {
              strengths: Array.isArray(data.aiFeedback?.strengths) ? data.aiFeedback.strengths : [],
              improvements: Array.isArray(data.aiFeedback?.improvements) ? data.aiFeedback.improvements : [],
              suggestions: Array.isArray(data.aiFeedback?.suggestions) ? data.aiFeedback.suggestions : [],
              ratingExplanation: String(data.aiFeedback?.ratingExplanation ?? data.feedback ?? ""),
            },
          } as UserAnswer
        })
      )
      setLoading(false)
    })

    return () => unsubscribe()
  }, [uid])

  const dailyActivity = useMemo(() => {
    const grouped = new Map<string, { count: number; totalScore: number }>()

    answers.forEach((answer) => {
      const dateKey = toDateKey(answer.answeredAt ?? answer.createdAt)
      const current = grouped.get(dateKey) ?? { count: 0, totalScore: 0 }
      current.count += 1
      current.totalScore += answer.score ?? answer.rating ?? 0
      grouped.set(dateKey, current)
    })

    return Array.from(grouped.entries()).map(([dateKey, value]) => ({
      dateKey,
      count: value.count,
      averageScore: value.count > 0 ? Math.round(value.totalScore / value.count) : 0,
    }))
  }, [answers])

  return { answers, dailyActivity, loading }
}
