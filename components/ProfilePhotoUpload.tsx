"use client"

import { useState } from "react"
import { updateProfile } from "firebase/auth"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { doc, updateDoc } from "firebase/firestore"

import { auth, db, storage } from "@/lib/firebase"
import { Button } from "@/components/ui/button"

export function ProfilePhotoUpload({ uid }: { uid: string }) {
  const [uploading, setUploading] = useState(false)

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const storageRef = ref(storage, `profilePhotos/${uid}/${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      await updateDoc(doc(db, "users", uid), { photoURL: downloadURL })

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL })
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        id="profile-photo-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            void handleUpload(file)
          }
        }}
      />
      <Button asChild variant="outline" disabled={uploading}>
        <label htmlFor="profile-photo-upload" className="cursor-pointer">
          {uploading ? "Uploading..." : "Upload photo"}
        </label>
      </Button>
    </div>
  )
}
