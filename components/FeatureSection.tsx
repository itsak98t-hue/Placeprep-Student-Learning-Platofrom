import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Code, FileText, Users, ArrowRight, Zap, Target, Award } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function FeatureSection() {
  return (
    <section className="py-16 md:py-24 section-gradient">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-4">
            <span className="gradient-text">Everything You Need</span>
            <br />
            <span className="text-foreground">to Succeed</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground text-lg md:text-xl">
            Comprehensive tools and resources designed specifically for students and job seekers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<BookOpen className="h-12 w-12" />}
            title="Learning Resources"
            description="Access comprehensive learning materials and courses to build your skills"
            link="/resources"
            color="from-blue-500 to-cyan-600"
            bgColor="from-blue-500/10 to-cyan-500/10"
          />
          <FeatureCard
            icon={<Code className="h-12 w-12" />}
            title="Practice Problems"
            description="Solve coding challenges and practice problems from top companies"
            link="/practice"
            color="from-green-500 to-emerald-600"
            bgColor="from-green-500/10 to-emerald-500/10"
          />
          <FeatureCard
            icon={<FileText className="h-12 w-12" />}
            title="Resume Builder"
            description="Create a professional resume with our templates and expert guidance"
            link="/resume"
            color="from-purple-500 to-pink-600"
            bgColor="from-purple-500/10 to-pink-500/10"
          />
          <FeatureCard
            icon={<Users className="h-12 w-12" />}
            title="Mock Interviews"
            description="Practice with mock interviews and get feedback from experts"
            link="/interviews"
            color="from-orange-500 to-red-600"
            bgColor="from-orange-500/10 to-red-500/10"
          />
        </div>

        {/* Additional features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border shadow-sm">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">Get instant feedback and results on your practice sessions</p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border shadow-sm">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 mb-4">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Targeted Learning</h3>
            <p className="text-muted-foreground">Personalized study plans based on your goals and progress</p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border shadow-sm">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 mb-4">
              <Award className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Proven Results</h3>
            <p className="text-muted-foreground">Join thousands of successful students who landed their dream jobs</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  link,
  color,
  bgColor,
}: {
  icon: React.ReactNode
  title: string
  description: string
  link: string
  color: string
  bgColor: string
}) {
  return (
    <Card className="feature-card group">
      <CardHeader className="text-center">
        <div
          className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}
        >
          <div className={`bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{icon}</div>
        </div>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
        <Link href={link}>
          <Button variant="outline" className="w-full group border-primary/20 hover:bg-primary/5 bg-transparent">
            Explore
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
