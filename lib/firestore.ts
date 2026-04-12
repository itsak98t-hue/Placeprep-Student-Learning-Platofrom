// lib/firestore.ts
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ─────────────────────────────────────────────
// 1. USER PROFILE
// Collection: users/{uid}
// ─────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  college: string;
  branch: string;
  graduationYear: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function createUserProfile(uid: string, data: Omit<UserProfile, "uid">) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, {
    ...data,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

// ─────────────────────────────────────────────
// 2. RESUMES
// Collection: users/{uid}/resumes/{resumeId}
// ─────────────────────────────────────────────

export interface Resume {
  id?: string;
  title: string;
  targetCompany?: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    linkedin?: string;
    github?: string;
  };
  education: {
    institution: string;
    degree: string;
    branch: string;
    year: string;
    cgpa?: string;
  }[];
  skills: string[];
  experience: {
    company: string;
    role: string;
    duration: string;
    description: string;
  }[];
  projects: {
    name: string;
    tech: string;
    description: string;
    link?: string;
  }[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function addResume(uid: string, resume: Omit<Resume, "id">) {
  const ref = collection(db, "users", uid, "resumes");
  const docRef = await addDoc(ref, {
    ...resume,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getResumes(uid: string): Promise<Resume[]> {
  const ref = collection(db, "users", uid, "resumes");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Resume));
}

export async function getResume(uid: string, resumeId: string): Promise<Resume | null> {
  const ref = doc(db, "users", uid, "resumes", resumeId);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Resume) : null;
}

export async function updateResume(uid: string, resumeId: string, data: Partial<Resume>) {
  const ref = doc(db, "users", uid, "resumes", resumeId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteResume(uid: string, resumeId: string) {
  const ref = doc(db, "users", uid, "resumes", resumeId);
  await deleteDoc(ref);
}

// ─────────────────────────────────────────────
// 3. QUIZ / INTERVIEW ANSWERS
// Collection: users/{uid}/answers/{answerId}
// ─────────────────────────────────────────────

export interface QuizAnswer {
  id?: string;
  questionId: string;
  questionText: string;
  category: "aptitude" | "technical" | "hr" | "coding";
  userAnswer: string;
  isCorrect?: boolean;
  score?: number;
  timeTakenSeconds?: number;
  company?: string;
  createdAt?: Timestamp;
}

export async function saveAnswer(uid: string, answer: Omit<QuizAnswer, "id">) {
  const ref = collection(db, "users", uid, "answers");
  const docRef = await addDoc(ref, {
    ...answer,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getAnswers(uid: string): Promise<QuizAnswer[]> {
  const ref = collection(db, "users", uid, "answers");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizAnswer));
}

export async function getAnswersByCategory(uid: string, category: QuizAnswer["category"]) {
  const ref = collection(db, "users", uid, "answers");
  const q = query(ref, where("category", "==", category));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuizAnswer));
}