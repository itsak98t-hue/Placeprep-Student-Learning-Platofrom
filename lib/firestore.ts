import { auth } from "@/lib/firebase"
import { saveAnswer as saveUserAnswer, saveResume as saveUserResume } from "@/lib/firestore/userDataService"
import type { UserAnswer } from "@/types/answers"
import type { Resume, ResumeInput } from "@/types/resume"

function requireUserId() {
  const userId = auth.currentUser?.uid

  if (!userId) {
    throw new Error("User not logged in")
  }

  return userId
}

export async function saveAnswer(answerData: UserAnswer) {
  const userId = requireUserId()
  console.log("Saving for user:", userId)
  return saveUserAnswer(userId, answerData)
}

export async function saveResume(resumeData: Resume | ResumeInput) {
  const userId = requireUserId()
  console.log("Saving for user:", userId)
  return saveUserResume(userId, resumeData)
}
