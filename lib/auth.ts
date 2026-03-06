import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from "firebase/auth"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { auth, db, googleProvider, githubProvider } from "@/lib/firebase"

export async function createUserProfile(user: User, name?: string) {
  const ref = doc(db, "users", user.uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      name: name || user.displayName || "Student User",
      email: user.email || "",
      tier: "Tier 2 Student",
      profileCompletion: 75,
      problemsSolved: 0,
      interviewsCompleted: 0,
      badges: 0,
      createdAt: serverTimestamp(),
    })
  }
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  if (name) await updateProfile(cred.user, { displayName: name })
  await createUserProfile(cred.user, name)
  return cred.user
}

export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  await createUserProfile(cred.user)
  return cred.user
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider)
  await createUserProfile(cred.user)
  return cred.user
}

export async function loginWithGithub() {
  const cred = await signInWithPopup(auth, githubProvider)
  await createUserProfile(cred.user)
  return cred.user
}

export async function logoutUser() {
  await signOut(auth)
}