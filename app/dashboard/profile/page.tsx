"use client"

import { useEffect, useMemo, useState } from "react"
import { updateProfile } from "firebase/auth"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import Link from "next/link"
import { CalendarDays, Mail, User } from "lucide-react"

import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload"
import { useAuth } from "@/components/providers/AuthProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { auth, db } from "@/lib/firebase"
import { useUserAnalytics } from "@/hooks/useUserAnalytics"
import { useUserDocument } from "@/hooks/useUserDocument"

function formatCreatedAt(isoString: string | null) {
  if (!isoString) {
    return "Recently joined"
  }

  return new Date(isoString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function DashboardProfilePage() {
  const { user } = useAuth()
  const { userDoc, loading: userDocLoading } = useUserDocument(user?.uid)
  const { analytics, answers, loading: analyticsLoading } = useUserAnalytics(user?.uid)
  const [displayName, setDisplayName] = useState("")
  const [savingName, setSavingName] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    setDisplayName(userDoc?.displayName ?? "")
  }, [userDoc?.displayName])

  const loading = userDocLoading || analyticsLoading
  const createdAtIso =
    typeof userDoc?.createdAt?.toDate === "function" ? userDoc.createdAt.toDate().toISOString() : null

  const stats = useMemo(
    () => [
      { label: "Total Answers", value: String(answers.length) },
      { label: "Avg Score", value: `${analytics.avgScore}%` },
      { label: "Accuracy", value: `${analytics.accuracy}%` },
      { label: "Topics Covered", value: String(analytics.topicsCovered) },
    ],
    [analytics.accuracy, analytics.avgScore, analytics.topicsCovered, answers.length]
  )

  async function handleSaveName() {
    if (!user?.uid || !displayName.trim()) {
      return
    }

    setSavingName(true)
    setStatusMessage(null)

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: displayName.trim(),
          name: displayName.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      await setDoc(
        doc(db, "leaderboard", user.uid),
        {
          displayName: displayName.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: displayName.trim() })
      }

      setStatusMessage("Display name updated.")
    } finally {
      setSavingName(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card/95 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Profile</p>
            <h1 className="text-3xl font-bold tracking-tight">Your Live Profile</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Everything on this page is coming from your realtime Firestore profile and answer history.
            </p>
          </div>
          {user?.uid && <ProfilePhotoUpload uid={user.uid} />}
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border shadow-sm">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Account details
                </CardTitle>
                <CardDescription>Edit your live profile information here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border bg-muted/20">
                    {userDoc?.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userDoc.photoURL} alt={userDoc.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-semibold text-primary">
                        {userDoc?.displayName?.slice(0, 1).toUpperCase() ?? "P"}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">{userDoc?.displayName ?? "Student User"}</h2>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{userDoc?.tier ?? "Tier 2"}</Badge>
                      <Badge variant="outline">🔥 {userDoc?.streak ?? 0} day streak</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="displayName">
                      Display name
                    </label>
                    <div className="flex gap-3">
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder="Enter your display name"
                      />
                      <Button onClick={() => void handleSaveName()} disabled={savingName || !displayName.trim()}>
                        {savingName ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border bg-muted/10 p-4">
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        Email
                      </p>
                      <p className="mt-2 font-medium">{userDoc?.email ?? user?.email ?? "No email available"}</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/10 p-4">
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        Joined
                      </p>
                      <p className="mt-2 font-medium">{formatCreatedAt(createdAtIso)}</p>
                    </div>
                  </div>
                </div>

                {statusMessage && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-300">
                    {statusMessage}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Computed performance stats</CardTitle>
                <CardDescription>These values are derived from your Firestore answers in realtime.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border bg-muted/10 p-4">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {answers.length === 0 && (
            <EmptyProfileState />
          )}
        </>
      )}
    </main>
  )
}

function EmptyProfileState() {
  return (
    <Card className="border border-dashed shadow-sm">
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">No answer data yet</h2>
          <p className="text-sm text-muted-foreground">
            Your profile basics are live, but the computed stats will grow once you start practicing.
          </p>
        </div>
        <Button asChild>
          <Link href="/practice">Start Practicing</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
