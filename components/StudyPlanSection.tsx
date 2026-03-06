import type React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, BookOpen, Code, Database, Palette } from "lucide-react"

export default function StudyPlanSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-4">
            <span className="gradient-text">Structured Learning</span>
            <br />
            <span className="text-foreground">Paths</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Follow our expertly crafted study plans designed to help you achieve your career goals efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <StudyPlanCard
            title="Frontend Developer"
            description="Master HTML, CSS, JavaScript, and modern frameworks like React and Vue"
            progress={65}
            duration="8 weeks"
            topics={["HTML/CSS", "JavaScript", "React", "UI/UX"]}
            link="/study-plans/frontend"
            icon={<Palette className="h-6 w-6" />}
            color="from-pink-500 to-rose-600"
            bgColor="from-pink-500/10 to-rose-500/10"
          />
          <StudyPlanCard
            title="Data Structures & Algorithms"
            description="Ace technical interviews with comprehensive DSA preparation and practice"
            progress={42}
            duration="10 weeks"
            topics={["Arrays", "Linked Lists", "Trees", "Dynamic Programming"]}
            link="/study-plans/dsa"
            icon={<Code className="h-6 w-6" />}
            color="from-blue-500 to-cyan-600"
            bgColor="from-blue-500/10 to-cyan-500/10"
          />
          <StudyPlanCard
            title="System Design"
            description="Learn to design scalable and reliable distributed systems"
            progress={25}
            duration="6 weeks"
            topics={["Scalability", "Databases", "Caching", "Microservices"]}
            link="/study-plans/system-design"
            icon={<Database className="h-6 w-6" />}
            color="from-green-500 to-emerald-600"
            bgColor="from-green-500/10 to-emerald-500/10"
          />
        </div>

        <div className="text-center mt-12">
          <Link href="/study-plans">
            <Button size="lg" variant="outline" className="group border-primary/20 hover:bg-primary/5 bg-transparent">
              View All Study Plans
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

function StudyPlanCard({
  title,
  description,
  progress,
  duration,
  topics,
  link,
  icon,
  color,
  bgColor,
}: {
  title: string
  description: string
  progress: number
  duration: string
  topics: string[]
  link: string
  icon: React.ReactNode
  color: string
  bgColor: string
}) {
  return (
    <Card className="study-plan-card group">
      <CardHeader>
        <div className="flex justify-between items-start mb-4">
          <div
            className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${bgColor} group-hover:scale-110 transition-transform duration-300`}
          >
            <div className={`bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{icon}</div>
          </div>
          <Badge variant="outline" className="flex items-center bg-muted/50">
            <Clock className="mr-1 h-3 w-3" />
            {duration}
          </Badge>
        </div>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="font-medium">Progress</span>
              <span className="font-semibold text-primary">{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`progress-bar rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Topics covered:</p>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-muted/70 hover:bg-muted">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Link href={link} className="w-full">
          <Button className="w-full group bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
            {progress > 0 ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Continue Learning
              </>
            ) : (
              "Start Learning"
            )}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
