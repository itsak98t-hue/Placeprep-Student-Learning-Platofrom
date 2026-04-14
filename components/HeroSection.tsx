"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, Code, GraduationCap, Star, TrendingUp, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCompanies } from "@/hooks/useCompanies"
import { usePlatformStats } from "@/hooks/usePlatformStats"

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

export default function HeroSection() {
  const { stats } = usePlatformStats()
  const { companies } = useCompanies()

  return (
    <section className="relative overflow-hidden py-12 md:py-24 lg:py-32 xl:py-36">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
      <div className="absolute left-10 top-20 h-72 w-72 animate-pulse rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 blur-3xl" />
      <div className="absolute bottom-20 right-10 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-pink-500/20 to-orange-500/20 blur-3xl delay-1000" />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <Badge className="w-fit border-primary/20 bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary hover:bg-gradient-to-r hover:from-primary/20 hover:to-purple-500/20">
                <Star className="mr-1 h-3 w-3" />
                Live platform stats from Firestore
              </Badge>

              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl xl:text-7xl/none">
                <span className="gradient-text">Prepare for Your</span>
                <br />
                <span className="text-foreground">Dream Career</span>
              </h1>

              <p className="max-w-[600px] text-lg leading-relaxed text-muted-foreground md:text-xl">
                PlacePrep now adapts to real practice history, live streaks, and AI-powered feedback so every metric you see reflects actual progress.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/auth/signup">
                <Button size="lg" className="glow-button group">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/resources">
                <Button size="lg" variant="outline" className="border-primary/20 bg-transparent hover:bg-primary/5">
                  Explore Resources
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 pt-4">
              <StatPill
                icon={<Users className="h-4 w-4 text-primary" />}
                label="Active Users"
                value={formatCompact(stats.totalUsers)}
              />
              <StatPill
                icon={<TrendingUp className="h-4 w-4 text-green-600" />}
                label="Avg Platform Score"
                value={`${Math.round(stats.avgPlatformScore)}%`}
              />
              <StatPill
                icon={<GraduationCap className="h-4 w-4 text-orange-600" />}
                label="Companies"
                value={String(companies.length)}
              />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative h-[400px] w-full md:h-[500px] lg:h-[600px]">
              <div className="absolute inset-0 animate-float rounded-3xl shadow-2xl glass-card">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 opacity-90" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white">
                  <div className="space-y-6 text-center">
                    <div className="mb-4 flex items-center justify-center">
                      <BookOpen className="h-12 w-12" />
                    </div>
                    <div className="text-5xl font-bold">PlacePrep</div>
                    <div className="text-xl opacity-90">Real progress. Real feedback. Real readiness.</div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="rounded-xl bg-white/10 p-4 text-center backdrop-blur-sm">
                        <Code className="mx-auto mb-2 h-6 w-6" />
                        <div className="text-sm font-medium">{formatCompact(stats.totalAnswers)} answers logged</div>
                      </div>
                      <div className="rounded-xl bg-white/10 p-4 text-center backdrop-blur-sm">
                        <Users className="mx-auto mb-2 h-6 w-6" />
                        <div className="text-sm font-medium">{companies.length} company tracks</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 -top-4 flex h-20 w-20 animate-bounce items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg delay-300">
                <Star className="h-8 w-8 text-white" />
              </div>

              <div className="absolute -bottom-4 -left-4 flex h-16 w-16 animate-bounce items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg delay-700">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 p-2">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
