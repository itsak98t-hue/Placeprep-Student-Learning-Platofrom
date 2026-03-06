import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import HeroSection from "@/components/HeroSection"
import FeatureSection from "@/components/FeatureSection"
import TrendingCompanies from "@/components/TrendingCompanies"
import ActivityCalendar from "@/components/ActivityCalendar"
import StudyPlanSection from "@/components/StudyPlanSection"

export default function Home() {
  return (
    <div>
      <HeroSection />

      <FeatureSection />

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <TrendingCompanies />
            </div>
            <div>
              <ActivityCalendar />
            </div>
          </div>
        </div>
      </section>

      <StudyPlanSection />

      <section className="my-16 container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Popular Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ResourceCard
            title="Interview Preparation"
            description="Comprehensive guides and practice for technical interviews"
            image="/placeholder.svg?height=200&width=300"
            link="/resources/interviews"
          />
          <ResourceCard
            title="Resume Building"
            description="Templates and tips to create a standout resume"
            image="/placeholder.svg?height=200&width=300"
            link="/resources/resume"
          />
          <ResourceCard
            title="Coding Challenges"
            description="Practice coding problems from top companies"
            image="/placeholder.svg?height=200&width=300"
            link="/resources/coding"
          />
        </div>
      </section>
    </div>
  )
}

function ResourceCard({
  title,
  description,
  image,
  link,
}: {
  title: string
  description: string
  image: string
  link: string
}) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-primary/20">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Link href={link} passHref>
          <Button className="w-full glow-button">Explore</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
