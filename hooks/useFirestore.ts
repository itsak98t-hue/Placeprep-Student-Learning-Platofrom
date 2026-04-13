"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { collection, doc, onSnapshot, orderBy, query, where } from "firebase/firestore"

import { auth, db } from "@/lib/firebase"
import type { QuizAnswer, Resume, UserProfile } from "@/lib/firestore"

function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser)
    return () => unsubscribe()
  }, [])

  return user
}

export function useUserProfile() {
  const user = useCurrentUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      setProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { profile, loading }
}

export function useResumes() {
  const user = useCurrentUser()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setResumes([])
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(collection(db, "users", user.uid, "resumes"), (snapshot) => {
      setResumes(snapshot.docs.map((resumeDoc) => ({ id: resumeDoc.id, ...resumeDoc.data() } as Resume)))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { resumes, loading }
}

export function useAnswers() {
  const user = useCurrentUser()
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setAnswers([])
      setLoading(false)
      return
    }

    const answersQuery = query(
      collection(db, "answers"),
      where("uid", "==", user.uid),
      orderBy("answeredAt", "desc")
    )

    const unsubscribe = onSnapshot(answersQuery, (snapshot) => {
      setAnswers(snapshot.docs.map((answerDoc) => ({ id: answerDoc.id, ...answerDoc.data() } as QuizAnswer)))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  return { answers, loading }
}
