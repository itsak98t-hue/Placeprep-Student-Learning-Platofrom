"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Code,
  FileText,
  GraduationCap,
  LogOut,
  Settings,
  Trophy,
  User as UserIcon,
} from "lucide-react"
import { doc, getDoc } from "firebase/firestore"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/providers/AuthProvider"
import { logoutUser } from "@/lib/auth"
import { db } from "@/lib/firebase"

type ProfileStats = {
  tierLabel: string
  profileCompletion: number
  problemsSolved: number
  interviewsCompleted: number
  badges: number
  photoURL: string
}

const defaultStats: ProfileStats = {
  tierLabel: "Tier 2 Student",
  profileCompletion: 20,
  problemsSolved: 0,
  interviewsCompleted: 0,
  badges: 0,
  photoURL: "",
}

const navigationItems = [
  { label: "My Profile", href: "/dashboard/profile", icon: UserIcon },
  { label: "My Resume", href: "/dashboard/resume", icon: FileText },
  { label: "My Submissions", href: "/dashboard/submissions", icon: Code },
  { label: "Activity Calendar", href: "/dashboard/calendar", icon: Calendar },
  { label: "Achievements", href: "/dashboard/achievements", icon: Trophy },
  { label: "Study Plan", href: "/dashboard/study-plan", icon: GraduationCap },
] as const

const statCards = [
  {
    label: "Problems",
    href: "/practice",
    valueKey: "problemsSolved" as const,
    className: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20",
    valueClassName: "text-blue-600",
  },
  {
    label: "Interviews",
    href: "/dashboard/mock-interview",
    valueKey: "interviewsCompleted" as const,
    className: "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20",
    valueClassName: "text-green-600",
  },
  {
    label: "Badges",
    href: "/dashboard/achievements",
    valueKey: "badges" as const,
    className: "bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20",
    valueClassName: "text-orange-600",
  },
] as const

export default function ProfileSection() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<ProfileStats>(defaultStats)

  useEffect(() => {
    if (!user) {
      return
    }

    const loadProfile = async () => {
      try {
        const ref = doc(db, "users", user.uid)
        const snap = await getDoc(ref)

        if (!snap.exists()) {
          return
        }

        const data = snap.data()
        const tier = typeof data.tier === "string" ? data.tier : "free"
        const normalizedTier = tier === "free" ? "Tier 2 Student" : `${tier} Student`

        setStats({
          tierLabel: normalizedTier,
          profileCompletion:
            typeof data.profileCompletion === "number" ? Math.max(0, Math.min(100, data.profileCompletion)) : 20,
          problemsSolved: typeof data.problemsSolved === "number" ? data.problemsSolved : 0,
          interviewsCompleted: typeof data.interviewsCompleted === "number" ? data.interviewsCompleted : 0,
          badges: typeof data.badges === "number" ? data.badges : 0,
          photoURL: typeof data.photoURL === "string" ? data.photoURL : "",
        })
      } catch (error) {
        console.error("Profile stats load failed:", error)
      }
    }

    void loadProfile()
  }, [user])

  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (loading || !user) return null

  const displayName = user.displayName || "Student User"
  const email = user.email || "student@example.com"
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const avatarSource = user.photoURL || stats.photoURL || "/placeholder.svg?height=64&width=64"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto rounded-full border border-primary/20 bg-background/40 px-2 py-1 hover:bg-primary/5"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={avatarSource} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-purple-500/10 font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold leading-none">{displayName}</p>
              <Badge className="mt-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                {stats.tierLabel.replace(" Student", "")}
              </Badge>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 overflow-hidden border-0 p-0 shadow-xl glass-card">
        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              <AvatarImage src={avatarSource} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-purple-500/10 text-lg font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="truncate text-xl font-bold">{displayName}</p>
              <p className="truncate text-sm text-muted-foreground">{email}</p>
              <Badge className="mt-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                {stats.tierLabel}
              </Badge>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Profile Completion</span>
              <span className="font-semibold text-primary">{stats.profileCompletion}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div className="h-2 rounded-full bg-gradient-to-r from-primary to-purple-600" style={{ width: `${stats.profileCompletion}%` }} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {statCards.map((card) => (
              <button
                key={card.label}
                type="button"
                onClick={() => router.push(card.href)}
                className={`rounded-xl p-3 text-left transition hover:scale-[1.02] hover:shadow-md ${card.className}`}
              >
                <p className={`text-center text-2xl font-bold ${card.valueClassName}`}>{stats[card.valueKey]}</p>
                <p className="text-center text-xs font-medium text-muted-foreground">{card.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="p-2">
          {navigationItems.map((item) => {
            const Icon = item.icon

            return (
              <DropdownMenuItem
                key={item.label}
                className="cursor-pointer rounded-lg"
                onClick={() => router.push(item.href)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </DropdownMenuItem>
            )
          })}

          <DropdownMenuSeparator />

          <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => router.push("/dashboard/settings")}>
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer rounded-lg text-red-500 focus:text-red-500"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
