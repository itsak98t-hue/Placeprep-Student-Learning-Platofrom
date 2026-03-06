"use client"

import { useRouter } from "next/navigation"
import { LogOut, Settings, User as UserIcon, FileText, Code, Calendar, Trophy, GraduationCap } from "lucide-react"

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

export default function ProfileSection() {
  const { user, loading } = useAuth()
  const router = useRouter()

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto rounded-full border border-primary/20 bg-background/40 px-2 py-1 hover:bg-primary/5"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold leading-none">{displayName}</p>
              <Badge className="mt-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">Tier 2</Badge>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 glass-card border-0 shadow-xl p-0 overflow-hidden">
        <div className="p-5 bg-gradient-to-br from-primary/10 to-purple-500/10">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              <AvatarImage src="/placeholder.svg?height=64&width=64" alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="text-xl font-bold truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">{email}</p>
              <Badge className="mt-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">Tier 2 Student</Badge>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Profile Completion</span>
              <span className="font-semibold text-primary">75%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-2 w-[75%] rounded-full bg-gradient-to-r from-primary to-purple-600" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <p className="text-2xl font-bold text-blue-600">42</p>
              <p className="text-xs text-muted-foreground font-medium">Problems</p>
            </div>
            <div className="rounded-xl p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <p className="text-2xl font-bold text-green-600">3</p>
              <p className="text-xs text-muted-foreground font-medium">Interviews</p>
            </div>
            <div className="rounded-xl p-3 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
              <p className="text-2xl font-bold text-orange-600">8</p>
              <p className="text-xs text-muted-foreground font-medium">Badges</p>
            </div>
          </div>
        </div>

        <div className="p-2">
          <DropdownMenuItem className="rounded-lg cursor-pointer">
            <UserIcon className="mr-3 h-4 w-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-lg cursor-pointer">
            <FileText className="mr-3 h-4 w-4" />
            My Resume
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-lg cursor-pointer">
            <Code className="mr-3 h-4 w-4" />
            My Submissions
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-lg cursor-pointer">
            <Calendar className="mr-3 h-4 w-4" />
            Activity Calendar
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-lg cursor-pointer">
            <Trophy className="mr-3 h-4 w-4" />
            Achievements
          </DropdownMenuItem>
          <DropdownMenuItem className="rounded-lg cursor-pointer">
            <GraduationCap className="mr-3 h-4 w-4" />
            Study Plan
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="rounded-lg cursor-pointer">
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleLogout}
            className="rounded-lg cursor-pointer text-red-500 focus:text-red-500"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}