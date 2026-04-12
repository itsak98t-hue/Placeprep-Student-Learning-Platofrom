import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight, BookOpen, Code, GraduationCap, Star, TrendingUp, Users } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="relative py-12 md:py-24 lg:py-32 xl:py-36 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_600px] items-center">
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <Badge className="w-fit bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border-primary/20 hover:bg-gradient-to-r hover:from-primary/20 hover:to-purple-500/20">
                <Star className="w-3 h-3 mr-1" />
                Trusted by 50,000+ Students
              </Badge>

              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl xl:text-7xl/none">
                <span className="gradient-text">Prepare for Your</span>
                <br />
                <span className="text-foreground">Dream Career</span>
              </h1>

              <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl leading-relaxed">
                Join thousands of students who have successfully prepared for their careers with PlacePrep. Get access
                to resources, practice problems, and expert guidance from industry professionals.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="glow-button group">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/resources">
                <Button size="lg" variant="outline" className="border-primary/20 hover:bg-primary/5 bg-transparent">
                  Explore Resources
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">50,000+</p>
                  <p className="text-xs text-muted-foreground">Active Students</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">95%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10">
                  <GraduationCap className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">500+</p>
                  <p className="text-xs text-muted-foreground">Companies</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px]">
              {/* Main hero card */}
              <div className="absolute inset-0 glass-card rounded-3xl shadow-2xl animate-float">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-pink-600 rounded-3xl opacity-90" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                  <div className="text-center space-y-6">
                    <div className="flex items-center justify-center mb-4">
                      <BookOpen className="h-12 w-12" />
                    </div>
                    <div className="text-5xl font-bold">PlacePrep</div>
                    <div className="text-xl opacity-90">Your Career Success Partner</div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                        <Code className="h-6 w-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">Coding Practice</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                        <Users className="h-6 w-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">Mock Interviews</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg animate-bounce delay-300 flex items-center justify-center">
                <Star className="h-8 w-8 text-white" />
              </div>

              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-lg animate-bounce delay-700 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
