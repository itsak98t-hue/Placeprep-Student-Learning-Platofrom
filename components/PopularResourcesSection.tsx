"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCourses } from "@/hooks/useCourses"

export default function PopularResourcesSection() {
  const { courses, loading } = useCourses()
  const featuredCourses = courses.slice(0, 3)

  return (
    <section className="container mx-auto my-16 px-4">
      <h2 className="mb-8 text-center text-3xl font-bold">Popular Resources</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-border/70 p-6">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-4/5" />
                <Skeleton className="mt-6 h-10 w-full rounded-xl" />
              </div>
            ))
          : featuredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-primary/20">
                <CardHeader>
                  <CardTitle>{course.label}</CardTitle>
                  <CardDescription>
                    Explore {course.totalTopics} topics, targeted practice, and AI-generated study support for {course.label}.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild className="w-full glow-button">
                    <Link href={`/resources#${course.id}`}>Explore</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
      </div>
    </section>
  )
}
