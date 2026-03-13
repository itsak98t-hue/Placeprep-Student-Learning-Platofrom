"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { QuestionDetailHeader } from "@/components/practice/QuestionDetailHeader"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { PracticeQuestion } from "@/data/types"
import { useQuestionProgress } from "@/hooks/use-question-progress"

type PracticeQuestionDetailProps = {
  question: PracticeQuestion
}

export function PracticeQuestionDetail({ question }: PracticeQuestionDetailProps) {
  const progress = useQuestionProgress([question])

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="outline">
        <Link href={question.company === "google" ? "/company/google" : "/company/microsoft"}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {question.company === "google" ? "Google" : "Microsoft"} Questions
        </Link>
      </Button>

      <Card className="border shadow-xl">
        <CardHeader>
          <QuestionDetailHeader
            question={question}
            solved={progress.isSolved(question.id)}
            attempted={progress.isAttempted(question.id)}
            bookmarked={progress.isBookmarked(question.id)}
            onSolvedToggle={() => progress.toggleSolved(question.id)}
            onAttemptedToggle={() => progress.toggleAttempted(question.id)}
            onBookmarkedToggle={() => progress.toggleBookmarked(question.id)}
          />
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Problem Statement</CardTitle>
            <CardDescription>{question.shortDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{question.fullPrompt}</p>

            <div>
              <h2 className="mb-2 text-lg font-semibold">Why It Matters</h2>
              <p className="text-sm leading-7 text-muted-foreground">{question.whyItMatters}</p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold">Test Cases</h2>
              <div className="space-y-3">
                {question.testCases.map((testCase, index) => (
                  <div key={`${question.id}-test-${index}`} className="rounded-2xl border bg-muted/30 p-4 text-sm">
                    <p><span className="font-medium">Input:</span> {testCase.input}</p>
                    <p className="mt-2"><span className="font-medium">Output:</span> {testCase.output}</p>
                    {testCase.explanation && (
                      <p className="mt-2 text-muted-foreground">{testCase.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold">Your Workspace</h2>
              <Textarea
                className="min-h-[260px] font-mono text-sm"
                placeholder={question.starterCode?.javascript || "Write your solution, pseudocode, or notes here..."}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Hints & Approach</CardTitle>
              <CardDescription>Reveal these only when you want guided help.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="hints">
                  <AccordionTrigger>Hints</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                      {question.hints.map((hint) => (
                        <li key={hint}>{hint}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="approach">
                  <AccordionTrigger>Approach / Solution Outline</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-7 text-muted-foreground">{question.approach}</p>
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
              <Button variant="outline" onClick={() => progress.toggleSolved(question.id)}>
                {progress.isSolved(question.id) ? "Unmark Solved" : "Mark as Solved"}
              </Button>
              <Button variant="outline" onClick={() => progress.toggleAttempted(question.id)}>
                {progress.isAttempted(question.id) ? "Unmark Attempted" : "Mark as Attempted"}
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
