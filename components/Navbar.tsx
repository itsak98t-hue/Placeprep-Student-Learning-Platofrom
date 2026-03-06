"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Bell,
  BookOpen,
  Calendar,
  Code,
  FileText,
  Github,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Moon,
  Star,
  Sun,
  Trophy,
  User,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMobile } from "@/hooks/use-mobile"
import ProfileSection from "@/components/ProfileSection"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/providers/AuthProvider"
import { logoutUser } from "@/lib/auth"

export default function Navbar() {
  const isMobile = useMobile()
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()

  const isAuthenticated = !!user

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (loading) return null

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-xl shadow-lg border-b border-border/50"
          : "bg-background/50 backdrop-blur-sm"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 group-hover:from-primary/20 group-hover:to-purple-500/20 transition-all duration-300">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-xl gradient-text">PlacePrep</span>
          </Link>

          {!isMobile && (
            <nav className="flex items-center gap-8">
              <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>
                Home
              </Link>
              <Link href="/resources" className={`nav-link ${pathname === "/resources" ? "active" : ""}`}>
                Resources
              </Link>
              <Link href="/practice" className={`nav-link ${pathname === "/practice" ? "active" : ""}`}>
                Practice
              </Link>
              <Link href="/companies" className={`nav-link ${pathname === "/companies" ? "active" : ""}`}>
                Companies
              </Link>
              <Link href="/community" className={`nav-link ${pathname === "/community" ? "active" : ""}`}>
                Community
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!isMobile && isAuthenticated ? (
            <>
              <ThemeToggle />
              <NotificationsDropdown />
              <ProfileSection />
            </>
          ) : !isMobile && !isAuthenticated ? (
            <>
              <ThemeToggle />
              <Link href="/auth/login">
                <Button variant="ghost" className="hover:bg-primary/5">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="glow-button">Sign up</Button>
              </Link>
            </>
          ) : (
            <MobileMenu
              isAuthenticated={isAuthenticated}
              userName={user?.displayName || "Student User"}
              userEmail={user?.email || "student@example.com"}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </header>
  )
}

function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="hover-scale hover:bg-primary/5">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-0 shadow-xl">
        <DropdownMenuItem onClick={() => setTheme("light")} className="hover:bg-primary/5">
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="hover:bg-primary/5">
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("github")} className="hover:bg-primary/5">
          <Github className="mr-2 h-4 w-4" />
          <span>GitHub</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationsDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover-scale hover:bg-primary/5">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-gradient-to-r from-primary to-purple-600 animate-pulse-glow"></span>
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 glass-card border-0 shadow-xl">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white">New</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          <NotificationItem
            title="New Mock Interview Available"
            description="A new System Design mock interview is available for you."
            time="2 hours ago"
            icon={<User className="h-4 w-4 text-primary" />}
          />
          <NotificationItem
            title="Achievement Unlocked"
            description="You've completed 50 coding challenges!"
            time="Yesterday"
            icon={<Trophy className="h-4 w-4 text-yellow-500" />}
          />
          <NotificationItem
            title="New Company Added"
            description="Microsoft has been added to your watchlist."
            time="2 days ago"
            icon={<Star className="h-4 w-4 text-blue-500" />}
          />
          <NotificationItem
            title="Resume Review Complete"
            description="Your resume has been reviewed. Check the feedback."
            time="3 days ago"
            icon={<FileText className="h-4 w-4 text-green-500" />}
          />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-center hover:bg-primary/5">
          <Link href="/notifications" className="w-full text-primary text-sm font-medium">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationItem({
  title,
  description,
  time,
  icon,
}: {
  title: string
  description: string
  time: string
  icon: React.ReactNode
}) {
  return (
    <div className="notification-item">
      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">{icon}</div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        <p className="text-xs text-muted-foreground font-medium">{time}</p>
      </div>
    </div>
  )
}

function MobileMenu({
  isAuthenticated,
  userName,
  userEmail,
  onLogout,
}: {
  isAuthenticated: boolean
  userName: string
  userEmail: string
  onLogout: () => void
}) {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="hover-scale hover:bg-primary/5">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] glass-card border-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-xl gradient-text">PlacePrep</span>
            </div>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/5">
                <X className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </div>

          <div className="flex flex-col gap-4 py-4">
            {isAuthenticated && (
              <div className="flex flex-col gap-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage src="/placeholder.svg?height=48&width=48" alt="User" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary font-semibold">
                      {userName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{userName}</p>
                    <p className="text-sm text-muted-foreground">{userEmail}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Profile Completion</span>
                    <span className="font-semibold text-primary">75%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="progress-bar rounded-full h-2" style={{ width: "75%" }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                    <p className="text-lg font-bold text-blue-600">42</p>
                    <p className="text-xs text-muted-foreground font-medium">Problems</p>
                  </div>
                  <div className="rounded-xl p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <p className="text-lg font-bold text-green-600">3</p>
                    <p className="text-xs text-muted-foreground font-medium">Interviews</p>
                  </div>
                  <div className="rounded-xl p-3 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                    <p className="text-lg font-bold text-orange-600">8</p>
                    <p className="text-xs text-muted-foreground font-medium">Badges</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  pathname === "/"
                    ? "bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border border-primary/20"
                    : "hover:bg-gradient-to-r hover:from-primary/5 hover:to-purple-500/5"
                }`}
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Home</span>
              </Link>

              <Link
                href="/resources"
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  pathname === "/resources"
                    ? "bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border border-primary/20"
                    : "hover:bg-gradient-to-r hover:from-primary/5 hover:to-purple-500/5"
                }`}
              >
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">Resources</span>
              </Link>

              <Link
                href="/practice"
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  pathname === "/practice"
                    ? "bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border border-primary/20"
                    : "hover:bg-gradient-to-r hover:from-primary/5 hover:to-purple-500/5"
                }`}
              >
                <Code className="h-5 w-5" />
                <span className="font-medium">Practice</span>
              </Link>

              <Link
                href="/companies"
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  pathname === "/companies"
                    ? "bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border border-primary/20"
                    : "hover:bg-gradient-to-r hover:from-primary/5 hover:to-purple-500/5"
                }`}
              >
                <GraduationCap className="h-5 w-5" />
                <span className="font-medium">Companies</span>
              </Link>

              <Link
                href="/community"
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  pathname === "/community"
                    ? "bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border border-primary/20"
                    : "hover:bg-gradient-to-r hover:from-primary/5 hover:to-purple-500/5"
                }`}
              >
                <User className="h-5 w-5" />
                <span className="font-medium">Community</span>
              </Link>

              <Link
                href="/calendar"
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  pathname === "/calendar"
                    ? "bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border border-primary/20"
                    : "hover:bg-gradient-to-r hover:from-primary/5 hover:to-purple-500/5"
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Activity Calendar</span>
              </Link>
            </nav>

            <div className="flex flex-col gap-2 mt-4">
              <div className="flex items-center justify-between p-3">
                <span className="font-medium">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="mt-auto pb-8">
            {isAuthenticated ? (
              <Button
                variant="destructive"
                onClick={onLogout}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/5 bg-transparent">
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="w-full glow-button">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}