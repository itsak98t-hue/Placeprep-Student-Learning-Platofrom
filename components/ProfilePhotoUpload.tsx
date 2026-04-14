"use client"

import { useState } from "react"
import { updateProfile } from "firebase/auth"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { doc, updateDoc } from "firebase/firestore"

import { auth, db, storage } from "@/lib/firebase"
import { Button } from "@/components/ui/button"

export function ProfilePhotoUpload({ uid }: { uid: string }) {
  const [uploading, setUploading] = useState(false)
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      const storageRef = ref(storage, `profilePhotos/${uid}/${file.name}`)
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      await updateDoc(doc(db, "users", uid), { photoURL: downloadURL })

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL })
      }
      setPhotoURL(downloadURL)
    } catch (error) {
      console.error("Upload failed:", error)
      setUploadError("Upload failed. Please try again.")
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
      {photoURL ? <span className="text-xs text-muted-foreground">Photo updated.</span> : null}
      {uploadError ? <span className="text-xs text-destructive">{uploadError}</span> : null}
    </div>
  )
}
