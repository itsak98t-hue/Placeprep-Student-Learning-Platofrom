"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { BehavioralQuestion } from "@/data/types"
import { useBehavioralProgress } from "@/hooks/use-behavioral-progress"

type BehavioralQuestionDetailProps = {
  question: BehavioralQuestion
}

export function BehavioralQuestionDetail({ question }: BehavioralQuestionDetailProps) {
  const progress = useBehavioralProgress([question])

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="outline">
        <Link href={question.company === "google" ? "/company/google" : "/company/microsoft"}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {question.company === "google" ? "Google" : "Microsoft"} Behavioral Prep
        </Link>
      </Button>

      <Card className="border shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="tier-1 capitalize">{question.company}</Badge>
                <Badge variant="outline">{question.category}</Badge>
                <Badge variant="outline">Frequency: {question.frequency}</Badge>
                {progress.isPrepared(question.id) && <Badge className="bg-emerald-600 text-white">Prepared</Badge>}
                {progress.isBookmarked(question.id) && <Badge className="bg-sky-600 text-white">Bookmarked</Badge>}
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{question.title}</h1>
              <p className="text-sm text-muted-foreground">{question.sourceLabel}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => progress.togglePrepared(question.id)}>
                {progress.isPrepared(question.id) ? "Unmark Prepared" : "Mark Prepared"}
              </Button>
              <Button variant="outline" onClick={() => progress.toggleBookmarked(question.id)}>
                {progress.isBookmarked(question.id) ? "Remove Bookmark" : "Bookmark"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Behavioral Prompt</CardTitle>
            <CardDescription>Practice this response with a clear STAR-style structure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border bg-muted/20 p-5">
              <p className="text-base leading-7">{question.question}</p>
            </div>

            <div>
              <h2 className="mb-2 text-lg font-semibold">Why It Matters</h2>
              <p className="text-sm leading-7 text-muted-foreground">{question.whyItMatters}</p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold">Draft Your Answer</h2>
              <Textarea
                className="min-h-[260px] text-sm leading-6"
                placeholder="Write your STAR response here. Focus on the situation, the action you personally took, and the measurable result."
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Prep Guidance</CardTitle>
              <CardDescription>Reveal the guidance only when you want it.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="signals">
                  <AccordionTrigger>What Interviewers Look For</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                      {question.whatInterviewerLooksFor.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="tips">
                  <AccordionTrigger>Answer Tips</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                      {question.answerTips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="framework">
                  <AccordionTrigger>STAR Framework</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-7 text-muted-foreground">{question.sampleFramework}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Progress Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button variant="outline" onClick={() => progress.togglePrepared(question.id)}>
                {progress.isPrepared(question.id) ? "Unmark Prepared" : "Mark as Prepared"}
              </Button>
              <Button variant="outline" onClick={() => progress.toggleBookmarked(question.id)}>
                {progress.isBookmarked(question.id) ? "Remove Bookmark" : "Bookmark"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
