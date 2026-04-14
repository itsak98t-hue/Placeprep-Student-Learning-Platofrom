import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import { emptyResume, normalizeResume } from "@/lib/resume"
import type { Resume, ResumeCore, ResumeInput, ResumeListItem } from "@/types/resume"

/*
  Firestore rules reference for developer setup:

  match /users/{userId}/resumes/{resumeId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
*/

type ResumeDocument = Omit<Resume, "id" | "createdAt" | "updatedAt"> & {
  content?: ResumeCore
  score?: number
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
  uploadedAt?: Timestamp | null
  createdAtMs?: number
  updatedAtMs?: number
}

const RESUME_FIRESTORE_DEBUG = process.env.NEXT_PUBLIC_FIRESTORE_DEBUG_RESUMES === "true"

function toIsoString(value: Timestamp | null | undefined, fallbackMs?: number): string | undefined {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  if (typeof fallbackMs === "number") {
    return new Date(fallbackMs).toISOString()
  }

  return undefined
}

function resumesCollectionRef(userId: string) {
  return collection(db, "users", userId, "resumes")
}

function resumeDocRef(userId: string, resumeId: string) {
  return doc(db, "users", userId, "resumes", resumeId)
}

function getResumesCollectionPath(userId: string) {
  return `users/${userId}/resumes`
}

function getResumeDocPath(userId: string, resumeId: string) {
  return `users/${userId}/resumes/${resumeId}`
}

function logResumeDebug(message: string, metadata?: Record<string, unknown>) {
  if (!RESUME_FIRESTORE_DEBUG) {
    return
  }

  console.log(`[Resume Firestore] ${message}`, metadata ?? {})
}

async function listResumeDocuments(userId: string) {
  logResumeDebug("Querying resumes collection", {
    userId,
    path: getResumesCollectionPath(userId),
  })

  const snapshot = await getDocs(query(resumesCollectionRef(userId), orderBy("updatedAtMs", "desc")))

  logResumeDebug("Loaded resumes collection", {
    userId,
    path: getResumesCollectionPath(userId),
    count: snapshot.docs.length,
  })

  return snapshot
}

function toResumeDocument(resume: Resume | ResumeInput): ResumeDocument {
  const normalizedResume = normalizeResume(resume as Partial<Resume>)
  const content: ResumeCore = {
    personalInfo: normalizedResume.personalInfo,
    summary: normalizedResume.summary,
    education: normalizedResume.education,
    experience: normalizedResume.experience,
    projects: normalizedResume.projects,
    skills: normalizedResume.skills,
    certifications: normalizedResume.certifications,
    achievements: normalizedResume.achievements,
    interests: normalizedResume.interests,
    strengths: normalizedResume.strengths,
  }

  return {
    title: normalizedResume.title,
    targetRole: normalizedResume.targetRole,
    targetCompany: normalizedResume.targetCompany,
    template: normalizedResume.template,
    isDefault: normalizedResume.isDefault,
    score: normalizedResume.score ?? 0,
    fileName: normalizedResume.fileName ?? "",
    atsScore: normalizedResume.atsScore ?? 0,
    atsSuggestions: normalizedResume.atsSuggestions ?? [],
    atsKeywords: normalizedResume.atsKeywords ?? { found: [], missing: [] },
    atsSections: normalizedResume.atsSections ?? [],
    content,
    personalInfo: normalizedResume.personalInfo,
    summary: normalizedResume.summary,
    education: normalizedResume.education,
    experience: normalizedResume.experience,
    projects: normalizedResume.projects,
    skills: normalizedResume.skills,
    certifications: normalizedResume.certifications,
    achievements: normalizedResume.achievements,
    interests: normalizedResume.interests,
    strengths: normalizedResume.strengths,
  }
}

function sanitizeFirestoreData<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T
}

function toResume(id: string, data: ResumeDocument): Resume {
  const content = data.content ?? undefined

  return normalizeResume(
    {
      ...(content ?? {}),
      ...data,
      uploadedAt: toIsoString(data.uploadedAt, data.createdAtMs),
      createdAt: toIsoString(data.createdAt, data.createdAtMs),
      updatedAt: toIsoString(data.updatedAt, data.updatedAtMs),
    },
    id
  )
}

export async function getUserResumes(userId: string): Promise<ResumeListItem[]> {
  if (!userId) {
    return []
  }

  try {
    const snapshot = await listResumeDocuments(userId)
    return snapshot.docs.map((snapshotDoc) => {
      const resume = toResume(snapshotDoc.id, snapshotDoc.data() as ResumeDocument)

      return {
        id: resume.id,
        title: resume.title,
        targetRole: resume.targetRole,
        targetCompany: resume.targetCompany,
        template: resume.template,
        isDefault: resume.isDefault,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      }
    })
  } catch (error) {
    console.error("Firestore Error:", error)
    throw error
  }
}

export async function getResumeById(userId: string, resumeId: string): Promise<Resume | null> {
  if (!userId || !resumeId) {
    return null
  }

  try {
    logResumeDebug("Reading resume document", {
      userId,
      path: getResumeDocPath(userId, resumeId),
    })

    const snapshot = await getDoc(resumeDocRef(userId, resumeId))
    if (!snapshot.exists()) {
      logResumeDebug("Resume document not found", {
        userId,
        path: getResumeDocPath(userId, resumeId),
      })
      return null
    }

    return toResume(snapshot.id, snapshot.data() as ResumeDocument)
  } catch (error) {
    console.error("Firestore Error:", error)
    throw error
  }
}

export async function setDefaultResume(userId: string, resumeId: string): Promise<void> {
  if (!userId || !resumeId) {
    return
  }

  try {
    const snapshot = await listResumeDocuments(userId)
    if (snapshot.empty) {
      return
    }

    const now = Date.now()
    const batch = writeBatch(db)

    snapshot.docs.forEach((snapshotDoc) => {
      batch.update(snapshotDoc.ref, {
        isDefault: snapshotDoc.id === resumeId,
        updatedAt: serverTimestamp(),
        updatedAtMs: now,
      })
    })

    logResumeDebug("Setting default resume", {
      userId,
      path: getResumeDocPath(userId, resumeId),
    })

    await batch.commit()
  } catch (error) {
    console.error("Firestore Error:", error)
    throw error
  }
}

export async function createResume(userId: string, data?: ResumeInput): Promise<Resume> {
  if (!userId) {
    throw new Error("Missing user ID while creating a resume.")
  }

  try {
    const now = Date.now()
    const existingResumes = await getUserResumes(userId)
    const nextResume = normalizeResume({
      ...emptyResume,
      ...data,
      title: data?.title?.trim() || `Resume ${existingResumes.length + 1}`,
      targetRole: data?.targetRole?.trim() || emptyResume.targetRole,
      targetCompany: data?.targetCompany ?? "",
      isDefault: existingResumes.length === 0 ? true : Boolean(data?.isDefault),
    })

    logResumeDebug("Creating resume", {
      userId,
      path: getResumesCollectionPath(userId),
    })

    console.log("Saving for user:", userId)
    const createdRef = await addDoc(resumesCollectionRef(userId), {
      ...sanitizeFirestoreData(toResumeDocument(nextResume)),
      uploadedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAtMs: now,
      updatedAtMs: now,
    })

    if (nextResume.isDefault) {
      await setDefaultResume(userId, createdRef.id)
    }

    return {
      ...nextResume,
      id: createdRef.id,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    }
  } catch (error) {
    console.error("Firestore Error:", error)
    throw error
  }
}

export async function updateResume(
  userId: string,
  resumeId: string,
  data: ResumeInput | Partial<Resume>
): Promise<Resume> {
  if (!userId) {
    throw new Error("Missing user ID while updating a resume.")
  }
  if (!resumeId) {
    throw new Error("Missing resume ID while updating a resume.")
  }

  try {
    const existingResume = await getResumeById(userId, resumeId)
    if (!existingResume) {
      throw new Error("Resume not found.")
    }

    const now = Date.now()
    const nextResume = normalizeResume(
      {
        ...existingResume,
        ...data,
        id: existingResume.id,
        createdAt: existingResume.createdAt,
      },
      resumeId
    )

    logResumeDebug("Updating resume", {
      userId,
      path: getResumeDocPath(userId, resumeId),
    })

    console.log("Saving for user:", userId)
    await setDoc(
      resumeDocRef(userId, resumeId),
      sanitizeFirestoreData({
        ...toResumeDocument(nextResume),
        uploadedAt: nextResume.uploadedAt ? nextResume.uploadedAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedAtMs: now,
      }),
      { merge: true }
    )

    if (data.isDefault === true) {
      await setDefaultResume(userId, resumeId)
    }

    return {
      ...nextResume,
      updatedAt: new Date(now).toISOString(),
    }
  } catch (error) {
    console.error("Firestore Error:", error)
    throw error
  }
}

export async function saveResume(userId: string, resume: Resume): Promise<Resume> {
  if (!userId) {
    throw new Error("Missing user ID while saving a resume.")
  }

  if (!resume.id) {
    return createResume(userId, resume)
  }

  return updateResume(userId, resume.id, resume)
}

export async function deleteResume(userId: string, resumeId: string): Promise<void> {
  if (!userId || !resumeId) {
    return
  }

  try {
    const resumes = await getUserResumes(userId)
    const deletedResume = resumes.find((resume) => resume.id === resumeId)

    logResumeDebug("Deleting resume", {
      userId,
      path: getResumeDocPath(userId, resumeId),
    })

    await deleteDoc(resumeDocRef(userId, resumeId))

    if (deletedResume?.isDefault) {
      const remainingResumes = await getUserResumes(userId)
      if (remainingResumes[0]?.id) {
        await setDefaultResume(userId, remainingResumes[0].id)
      }
    }
  } catch (error) {
    console.error("Firestore Error:", error)
    throw error
  }
}

export async function duplicateResume(userId: string, resumeId: string): Promise<Resume | null> {
  try {
    const sourceResume = await getResumeById(userId, resumeId)
    if (!sourceResume) {
      return null
    }

    return createResume(userId, {
      ...sourceResume,
      title: `${sourceResume.title} (Copy)`,
      isDefault: false,
    })
  } catch (error) {
    console.error("Firestore Error:", error)
    throw error
  }
}

export async function updateResumeMetadata(
  userId: string,
  resumeId: string,
  metadata: Partial<Pick<Resume, "title" | "targetRole" | "targetCompany" | "template">>
): Promise<void> {
  if (!userId || !resumeId) {
    return
  }

  try {
    await updateDoc(resumeDocRef(userId, resumeId), {
      ...sanitizeFirestoreData(metadata),
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now(),
    })
  } catch (error) {
    console.error("Firestore Error:", error)
    throw error
  }
}

export const listResumes = getUserResumes
export const getResume = getResumeById
export const deleteResumeById = deleteResume
