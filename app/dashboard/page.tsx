import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, Code, FileText, GraduationCap, Users } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Student!</p>
        </div>
        <Button className="mt-4 md:mt-0 glow-button">
          <GraduationCap className="mr-2 h-4 w-4" />
          Start Learning
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <StatsCard title="Resume Views" value="18" description="+5 this week" icon={<FileText className="h-5 w-5" />} />
      </div>

      <Tabs defaultValue="progress" className="mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="progress">Your Progress</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
        </TabsList>
        <TabsContent value="progress">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Path: Full Stack Development</CardTitle>
                <CardDescription>4 of 12 modules completed</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={33} className="h-2 mb-4" />
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
                <Progress value={70} className="h-2 mb-4" />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">70% Complete</span>
                  <Link href="/interview-prep" className="text-sm text-primary hover:underline">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    <Card className="hover:shadow-md transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
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
    <Card className="hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href={link} passHref>
          <Button variant="outline" className="w-full">
            View Course
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
