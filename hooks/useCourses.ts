"use client"

import { useEffect, useState } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { CourseConfig } from "@/types/learning"

export function useCourses() {
  const [courses, setCourses] = useState<CourseConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const coursesQuery = query(collection(db, "courses"), orderBy("order"))
    const unsubscribe = onSnapshot(coursesQuery, (snapshot) => {
      setCourses(
        snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: String(data.id ?? doc.id),
            label: String(data.label ?? doc.id.toUpperCase()),
            totalTopics: Number(data.totalTopics ?? 0),
            topics: Array.isArray(data.topics) ? data.topics.map((topic) => String(topic)) : [],
            icon: String(data.icon ?? "book-open"),
          }
        })
      )
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { courses, loading }
}
