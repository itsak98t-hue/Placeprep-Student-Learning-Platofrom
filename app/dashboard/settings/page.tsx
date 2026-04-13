"use client"

import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { Settings } from "lucide-react"

import { useAuth } from "@/components/providers/AuthProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { db } from "@/lib/firebase"
import { useUserDocument, defaultSettings } from "@/hooks/useUserDocument"
import type { UserSettings } from "@/types/dashboard"

const settingLabels: Array<{
  key: keyof UserSettings
  title: string
  description: string
}> = [
  {
    key: "emailNotifications",
    title: "Email Notifications",
    description: "Receive email updates when new prep activity is available.",
  },
  {
    key: "darkMode",
    title: "Dark Mode",
    description: "Sync your visual theme preference across signed-in devices.",
  },
  {
    key: "practiceReminders",
    title: "Practice Reminders",
    description: "Get nudges to return to practice when your streak needs attention.",
  },
  {
    key: "weeklyReport",
    title: "Weekly Report",
    description: "Receive a summary of your weekly progress and readiness.",
  },
]

export default function DashboardSettingsPage() {
  const { user } = useAuth()
  const { userDoc, loading } = useUserDocument(user?.uid)
  const settings = { ...defaultSettings, ...(userDoc?.settings ?? {}) }

  async function handleToggle(key: keyof UserSettings, checked: boolean) {
    if (!user?.uid) {
      return
    }

    await setDoc(
      doc(db, "users", user.uid),
      {
        settings: {
          ...settings,
          [key]: checked,
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card/95 p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Settings</p>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <Settings className="h-7 w-7 text-primary" />
            Live Preferences
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Every toggle writes directly to your Firestore profile and stays synced across devices.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border shadow-sm">
              <CardContent className="flex items-center justify-between p-5">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-6 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {settingLabels.map((setting) => (
            <Card key={setting.key} className="border shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{setting.title}</CardTitle>
                    <CardDescription>{setting.description}</CardDescription>
                  </div>
                  <Switch
                    checked={settings[setting.key]}
                    onCheckedChange={(checked) => void handleToggle(setting.key, checked)}
                  />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
