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
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Star,
  Trophy,
  User,
  X,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMobile } from "@/hooks/use-mobile"
import ProfileSection from "@/components/ProfileSection"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/providers/AuthProvider"
import { useNotifications } from "@/hooks/useNotifications"
import { useUserDocument } from "@/hooks/useUserDocument"
import { logoutUser } from "@/lib/auth"
import { markNotificationRead } from "@/utils/notifications"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default function Navbar() {
  const isMobile = useMobile()
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const { userDoc } = useUserDocument(user?.uid)

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
              <ThemeSwitcher />
              <NotificationsDropdown uid={user?.uid} />
              <ProfileSection />
            </>
          ) : !isMobile && !isAuthenticated ? (
            <>
              <ThemeSwitcher />
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
              userName={userDoc?.displayName || user?.displayName || "Student User"}
              userEmail={userDoc?.email || user?.email || "student@example.com"}
              userPhotoURL={userDoc?.photoURL ?? user?.photoURL}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </header>
  )
}

function NotificationsDropdown({ uid }: { uid?: string | null }) {
  const { notifications, unreadCount, loading } = useNotifications(uid)
  const recentNotifications = notifications.slice(0, 10)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover-scale hover:bg-primary/5">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-primary to-purple-600 px-1 text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 glass-card border-0 shadow-xl">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white">
            {loading ? "..." : unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {recentNotifications.length > 0 ? (
            recentNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                uid={uid}
                id={notification.id}
                title={notification.title}
                description={notification.message}
                time={notification.createdAt?.toDate?.().toLocaleString?.() ?? "Just now"}
                read={notification.read}
                icon={getNotificationIcon(notification.type)}
              />
            ))
          ) : (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Real-time notifications will appear here as you practice.
            </div>
          )}
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
  uid,
  id,
  title,
  description,
  time,
  icon,
  read,
}: {
  uid?: string | null
  id: string
  title: string
  description: string
  time: string
  icon: React.ReactNode
  read: boolean
}) {
  return (
    <button
      type="button"
      className={`notification-item w-full text-left ${read ? "opacity-80" : ""}`}
      onClick={() => {
        if (uid) {
          void markNotificationRead(uid, id)
        }
      }}
    >
      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">{icon}</div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        <p className="text-xs text-muted-foreground font-medium">{time}</p>
      </div>
      {!read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />}
    </button>
  )
}

function getNotificationIcon(type: string) {
  if (type === "achievement") {
    return <Trophy className="h-4 w-4 text-yellow-500" />
  }
  if (type === "streak") {
    return <Star className="h-4 w-4 text-orange-500" />
  }
  if (type === "leaderboard") {
    return <GraduationCap className="h-4 w-4 text-blue-500" />
  }
  if (type === "reminder") {
    return <Calendar className="h-4 w-4 text-primary" />
  }

  return <FileText className="h-4 w-4 text-green-500" />
}

function MobileMenu({
  isAuthenticated,
  userName,
  userEmail,
  userPhotoURL,
  onLogout,
}: {
  isAuthenticated: boolean
  userName: string
  userEmail: string
  userPhotoURL?: string | null
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
                    <AvatarImage src={userPhotoURL || "/placeholder.svg?height=48&width=48"} alt="User" />
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

                <div className="rounded-xl border border-primary/10 bg-background/40 p-3 text-sm text-muted-foreground">
                  Live profile stats now come from your dashboard and leaderboard once you complete real practice sessions.
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
                <ThemeSwitcher />
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
