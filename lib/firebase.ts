import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import {
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
} from "firebase/auth"

import { getFirebasePublicConfig, isProd } from "@/lib/runtime-config"

const firebaseConfig = getFirebasePublicConfig()
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

if (!isProd) {
  console.log("[PlacePrep] Firebase config loaded", {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  })
}

export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const githubProvider = new GithubAuthProvider()
