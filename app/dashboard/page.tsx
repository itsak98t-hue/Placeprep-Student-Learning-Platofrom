"use client"

import type React from "react"
import Link from "next/link"
import {
  CalendarDays,
  Code,
  FileText,
  GraduationCap,
  Users,
  MessageSquare,
  ArrowRight,
  UserCircle2,
} from "lucide-react"

import { useAuth } from "@/components/providers/AuthProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

export default function DashboardPage() {
  const { user } = useAuth()

  const firstName = user?.displayName?.split(" ")[0] || "Student"

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border bg-muted">
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCircle2 className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {firstName}! Let’s keep your placement prep moving.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/resume">
            <Button className="glow-button">
              <FileText className="mr-2 h-4 w-4" />
              Build Resume
            </Button>
          </Link>

          <Link href="/dashboard/mock-interview">
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Start Interview
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickActionCard
          title="Resume Builder"
          description="Create and improve your resume for placements."
          icon={<FileText className="h-5 w-5" />}
          href="/dashboard/resume"
          cta="Open Resume"
        />
        <QuickActionCard
          title="Mock Interview"
          description="Practice interview questions in chat mode."
          icon={<MessageSquare className="h-5 w-5" />}
          href="/dashboard/mock-interview"
          cta="Start Practice"
        />
        <QuickActionCard
          title="Calendar"
          description="Track your preparation schedule and consistency."
          icon={<CalendarDays className="h-5 w-5" />}
          href="/dashboard/calendar"
          cta="View Calendar"
        />
        <QuickActionCard
          title="Community"
          description="Connect with students and share preparation tips."
          icon={<Users className="h-5 w-5" />}
          href="/dashboard/community"
          cta="Join Community"
        />
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Courses Completed"
          value="4"
          description="+2 this month"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatsCard
          title="Practice Problems"
          value="42"
          description="75% success rate"
          icon={<Code className="h-5 w-5" />}
        />
        <StatsCard
          title="Mock Interviews"
          value="3"
          description="Next: Tomorrow"
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          title="Resume Views"
          value="18"
          description="+5 this week"
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="progress" className="mb-8">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="progress">Your Progress</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
        </TabsList>

        <TabsContent value="progress">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Learning Path: Full Stack Development</CardTitle>
                <CardDescription>4 of 12 modules completed</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={33} className="mb-4 h-2" />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">33% Complete</span>
                  <Link href="/courses/full-stack" className="text-sm text-primary hover:underline">
                    Continue
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interview Preparation</CardTitle>
                <CardDescription>7 of 10 practice sessions completed</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={70} className="mb-4 h-2" />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">70% Complete</span>
                  <Link href="/dashboard/mock-interview" className="text-sm text-primary hover:underline">
                    Continue
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your scheduled activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Mock Interview: System Design</p>
                    <p className="text-sm text-muted-foreground">Tomorrow, 2:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Workshop: Resume Building</p>
                    <p className="text-sm text-muted-foreground">Friday, 6:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Coding Contest</p>
                    <p className="text-sm text-muted-foreground">Saturday, 10:00 AM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommended">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <RecommendedCard
              title="Data Structures & Algorithms"
              description="Master the fundamentals for technical interviews"
              link="/courses/dsa"
            />
            <RecommendedCard
              title="System Design Interview"
              description="Learn how to design scalable systems"
              link="/courses/system-design"
            />
            <RecommendedCard
              title="Behavioral Interview Prep"
              description="Practice answering common behavioral questions"
              link="/courses/behavioral"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatsCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function RecommendedCard({
  title,
  description,
  link,
}: {
  title: string
  description: string
  link: string
}) {
  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href={link}>
          <Button variant="outline" className="w-full">
            View Course
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
  cta,
}: {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  cta: string
}) {
  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href={href}>
          <Button variant="outline" className="w-full justify-between">
            {cta}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}