"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BookOpen, Briefcase, Building2, FileQuestion, Layers3, Sparkles } from "lucide-react"

import InterviewExperienceForm from "@/components/InterviewExperienceForm"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CompanyDetail } from "@/types/company"

type CompanyPrepContentProps = {
  company: CompanyDetail
  companySlug: string
}

type CompanyQuestionEntry = CompanyDetail["questionBank"][number]["questions"][number]

function getQuestionsForRound(company: CompanyDetail, roundTitle: string) {
  const lowerRound = roundTitle.toLowerCase()

  return company.questionBank.flatMap((category) =>
    category.questions
      .filter((question) => question.round.toLowerCase().includes(lowerRound) || lowerRound.includes(question.round.toLowerCase()))
      .map((question) => ({
        categoryTitle: category.title,
        ...question,
      }))
  )
}

export function CompanyPrepContent({
  company,
  companySlug,
}: CompanyPrepContentProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedRound, setSelectedRound] = useState<string>("All Rounds")

  const questionsWithCategory = useMemo(
    () =>
      company.questionBank.flatMap((category) =>
        category.questions.map((question) => ({
          categoryTitle: category.title,
          ...question,
        }))
      ),
    [company.questionBank]
  )

  const filteredQuestions = useMemo(() => {
    if (selectedRound === "All Rounds") {
      return questionsWithCategory
    }

    const lowerSelectedRound = selectedRound.toLowerCase()
    return questionsWithCategory.filter(
      (question) =>
        question.round.toLowerCase().includes(lowerSelectedRound) ||
        lowerSelectedRound.includes(question.round.toLowerCase())
    )
  }, [questionsWithCategory, selectedRound])

  const roundFilters = ["All Rounds", ...company.interviewRounds.map((round) => round.title)]

  const jumpToRoundQuestions = (roundTitle: string) => {
    setSelectedRound(roundTitle)
    setActiveTab("questions")
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-muted/50 p-2 md:grid-cols-5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="process">Interview Rounds</TabsTrigger>
        <TabsTrigger value="questions">Question Bank</TabsTrigger>
        <TabsTrigger value="prep">Prep Guide</TabsTrigger>
        <TabsTrigger value="resources">Resources</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <InfoCard
            icon={Building2}
            title={`About ${company.name}`}
            description="Company intro, hiring focus, and what interviewers typically value."
          >
            <div className="space-y-3 text-sm leading-7 text-muted-foreground">
              {company.overview.map((point) => (
                <p key={point}>{point}</p>
              ))}
            </div>
          </InfoCard>

          <InfoCard
            icon={Briefcase}
            title="Eligibility & Expectations"
            description="What candidates should be comfortable with before applying."
          >
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {company.eligibility.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </InfoCard>
        </div>

        <InfoCard
          icon={FileQuestion}
          title="Online Assessment"
          description={company.onlineAssessment.format}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 font-semibold">Common Topics</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {company.onlineAssessment.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-semibold">How To Prepare</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {company.onlineAssessment.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </InfoCard>
      </TabsContent>

      <TabsContent value="process" className="space-y-6">
        <div className="grid gap-4">
          {company.interviewRounds.map((round) => {
            const matchingQuestions = getQuestionsForRound(company, round.title)

            return (
              <Card key={round.title} className="border shadow-sm">
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-xl">{round.title}</CardTitle>
                      <CardDescription className="mt-2">{round.focus}</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{round.duration}</Badge>
                      <Button variant="outline" onClick={() => jumpToRoundQuestions(round.title)}>
                        Study This Round
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {round.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>

                  {matchingQuestions.length > 0 && (
                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <p className="font-medium">Questions mapped to this round</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {matchingQuestions.map((question) => (
                          <button
                            key={`${round.title}-${question.question}`}
                            type="button"
                            onClick={() => jumpToRoundQuestions(round.title)}
                            className="rounded-full border px-3 py-1 text-left text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
                          >
                            {question.categoryTitle}: {question.question}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Share Interview Experience</CardTitle>
            <CardDescription>
              Collect candidate experiences so this company page keeps getting stronger over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InterviewExperienceForm companySlug={companySlug} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="questions" className="space-y-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Learn By Specific Round</CardTitle>
            <CardDescription>
              Click any round below to study only the questions that belong to that stage of the interview.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {roundFilters.map((round) => (
              <Button
                key={round}
                variant={selectedRound === round ? "default" : "outline"}
                onClick={() => setSelectedRound(round)}
              >
                {round}
              </Button>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {filteredQuestions.map((entry, index) => (
            <Card key={`${entry.categoryTitle}-${index}`} className="border shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{entry.categoryTitle}</CardTitle>
                  <Badge variant="outline">{entry.round}</Badge>
                  <Badge variant="outline">{entry.difficulty}</Badge>
                </div>
                <CardDescription>{entry.question}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value={`${entry.categoryTitle}-${index}`}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      Study this question
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div>
                        <p className="mb-1 font-medium">What to focus on</p>
                        <p className="text-sm text-muted-foreground">{entry.whatToFocusOn}</p>
                      </div>
                      <div>
                        <p className="mb-2 font-medium">Answer outline</p>
                        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                          {entry.answerOutline.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredQuestions.length === 0 && (
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                No questions are mapped to this round yet. Switch to another round or add more company data.
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="prep" className="space-y-6">
        <InfoCard
          icon={Sparkles}
          title="Preparation Strategy"
          description="Use these steps to turn the company page into an actual prep plan."
        >
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {company.preparationTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </InfoCard>
      </TabsContent>

      <TabsContent value="resources" className="space-y-6">
        <InfoCard
          icon={BookOpen}
          title="Helpful Resources"
          description="Direct links to practice, resume, and learning resources relevant to this company."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {company.resources.map((resource) => (
              <Card key={resource.label} className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{resource.label}</CardTitle>
                  <CardDescription>{resource.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={resource.href}>Open Resource</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </InfoCard>
      </TabsContent>
    </Tabs>
  )
}

function InfoCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Layers3
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
