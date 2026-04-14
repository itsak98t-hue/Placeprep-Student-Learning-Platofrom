import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from "firebase/auth"
import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import { auth, db, googleProvider, githubProvider } from "@/lib/firebase"
import { createReminderNotification } from "@/utils/notifications"
import { incrementPlatformUserCount } from "@/utils/platform-stats"

export async function createUserProfile(user: User, name?: string) {
  const ref = doc(db, "users", user.uid)
  const snap = await getDoc(ref)
  const today = new Date().toISOString().split("T")[0]

  const profileData = {
    uid: user.uid,
    name: name || user.displayName || "Student User",
    displayName: name || user.displayName || "Student User",
    email: user.email || "",
    photoURL: user.photoURL || "",
    provider: user.providerData?.[0]?.providerId || "unknown",
    tier: "Tier 2",
    streak: 1,
    lastActiveDate: today,
    achievements: [],
    settings: {
      emailNotifications: false,
      darkMode: false,
      practiceReminders: false,
      weeklyReport: false,
    },
    targetRole: "",
    collegeYear: "",
    problemsSolved: 0,
    interviewsCompleted: 0,
    badges: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  if (!snap.exists()) {
    await setDoc(ref, profileData)
    await incrementPlatformUserCount()
  } else {
    await updateDoc(ref, {
      name: name || user.displayName || "Student User",
      displayName: name || user.displayName || "Student User",
      email: user.email || "",
      photoURL: user.photoURL || "",
      provider: user.providerData?.[0]?.providerId || "unknown",
      updatedAt: serverTimestamp(),
    })

    const lastActiveDate = snap.data()?.lastActiveDate
    if (typeof lastActiveDate === "string") {
      const today = new Date().toISOString().split("T")[0]
      const reminderDate = new Date()
      reminderDate.setDate(reminderDate.getDate() - 2)
      const reminderKey = reminderDate.toISOString().split("T")[0]

      if (lastActiveDate <= reminderKey && lastActiveDate !== today) {
        await createReminderNotification(user.uid)
      }
    }
  }
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)

  if (name) {
    await updateProfile(cred.user, { displayName: name })
  }

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
