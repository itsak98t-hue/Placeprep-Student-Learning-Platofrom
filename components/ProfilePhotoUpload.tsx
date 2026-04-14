"use client"

import { useState } from "react"
import { updateProfile } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"

import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"

export function ProfilePhotoUpload({ uid }: { uid: string }) {
  const [uploading, setUploading] = useState(false)
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = (await response.json()) as { url: string }
      const nextPhotoURL = data.url

      await updateDoc(doc(db, "users", uid), { photoURL: nextPhotoURL })

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: nextPhotoURL })
      }

      setPhotoURL(nextPhotoURL)
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
