import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore"

import { db } from "@/lib/firebase"

function sanitizeFirestoreData<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL?: string | null
  tier?: string
  streak?: number
  lastActiveDate?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export async function createUserProfile(uid: string, data: Omit<UserProfile, "uid">) {
  const ref = doc(db, "users", uid)
  await setDoc(
    ref,
    {
      ...sanitizeFirestoreData(data),
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const ref = doc(db, "users", uid)
  await updateDoc(ref, { ...sanitizeFirestoreData(data), updatedAt: serverTimestamp() })
}

export interface Resume {
  id?: string
  title: string
  targetCompany?: string
  personalInfo: {
    name: string
    email: string
    phone: string
    linkedin?: string
    github?: string
  }
  education: Array<{
    institution: string
    degree: string
    branch: string
    year: string
    cgpa?: string
  }>
  skills: string[]
  experience: Array<{
    company: string
    role: string
    duration: string
    description: string
  }>
  projects: Array<{
    name: string
    tech: string
    description: string
    link?: string
  }>
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export async function addResume(uid: string, resume: Omit<Resume, "id">) {
  const ref = collection(db, "users", uid, "resumes")
  const docRef = await addDoc(ref, {
    ...sanitizeFirestoreData(resume),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getResumes(uid: string): Promise<Resume[]> {
  const ref = collection(db, "users", uid, "resumes")
  const snap = await getDocs(ref)
  return snap.docs.map((resumeDoc) => ({ id: resumeDoc.id, ...resumeDoc.data() } as Resume))
}

export async function getResume(uid: string, resumeId: string): Promise<Resume | null> {
  const ref = doc(db, "users", uid, "resumes", resumeId)
  const snap = await getDoc(ref)
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Resume) : null
}

export async function updateResume(uid: string, resumeId: string, data: Partial<Resume>) {
  const ref = doc(db, "users", uid, "resumes", resumeId)
  await updateDoc(ref, { ...sanitizeFirestoreData(data), updatedAt: serverTimestamp() })
}

export interface QuizAnswer {
  id?: string
  uid: string
  courseId: string
  topicId: string
  questionId: string
  questionText: string
  category: "aptitude" | "technical" | "hr" | "coding" | "behavioral"
  userAnswer: string
  isCorrect?: boolean
  score?: number
  timeTakenSeconds?: number
  company?: string
  sessionId?: string
  answeredAt?: Timestamp
  createdAt?: Timestamp
}

export async function saveAnswer(uid: string, answer: Omit<QuizAnswer, "id" | "uid">) {
  const ref = collection(db, "answers")
  const docRef = await addDoc(ref, {
    ...sanitizeFirestoreData(answer),
    uid,
    answeredAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getAnswers(uid: string): Promise<QuizAnswer[]> {
  const answersQuery = query(
    collection(db, "answers"),
    where("uid", "==", uid),
    orderBy("answeredAt", "desc")
  )
  const snap = await getDocs(answersQuery)
  return snap.docs.map((answerDoc) => ({ id: answerDoc.id, ...answerDoc.data() } as QuizAnswer))
}

export async function getAnswersByCategory(uid: string, category: QuizAnswer["category"]) {
  const answersQuery = query(
    collection(db, "answers"),
    where("uid", "==", uid),
    where("category", "==", category),
    orderBy("answeredAt", "desc")
  )
  const snap = await getDocs(answersQuery)
  return snap.docs.map((answerDoc) => ({ id: answerDoc.id, ...answerDoc.data() } as QuizAnswer))
}
