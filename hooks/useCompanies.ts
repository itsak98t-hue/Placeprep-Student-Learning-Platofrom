"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { FirestoreCompany } from "@/types/learning"
import type { UserAnswer } from "@/types/answers"
import { computeReadiness } from "@/utils/computeReadiness"

export function useCompanies(answers: UserAnswer[] = []) {
  const [companies, setCompanies] = useState<FirestoreCompany[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const companyQuery = query(collection(db, "companies"), orderBy("order"))
    const unsubscribe = onSnapshot(companyQuery, (snapshot) => {
      setCompanies(
        snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: String(data.id ?? doc.id),
            name: String(data.name ?? doc.id),
            logo: String(data.logoUrl ?? data.logo ?? ""),
            requiredCourses: Array.isArray(data.requiredCourseIds)
              ? data.requiredCourseIds.map((courseId) => String(courseId))
              : Array.isArray(data.requiredCourses)
                ? data.requiredCourses.map((courseId) => String(courseId))
                : [],
            focusAreas: Array.isArray(data.focusAreas) ? data.focusAreas.map((item) => String(item)) : [],
            difficulty:
              data.difficulty === "easy" || data.difficulty === "medium" || data.difficulty === "hard"
                ? data.difficulty
                : "medium",
            avgPackageLPA: Number(data.avgPackageLPA ?? 0),
            openRoles: Array.isArray(data.openRoles) ? data.openRoles.map((role) => String(role)) : [],
            tips: String(data.tips ?? ""),
          }
        })
      )
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const decoratedCompanies = useMemo(
    () =>
      companies.map((company) => ({
        ...company,
        readinessScore: computeReadiness(company.requiredCourses, answers),
      })),
    [answers, companies]
  )

  return { companies: decoratedCompanies, loading }
}
