"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BookOpen, Briefcase, Building2, FileQuestion, Layers3, Sparkles } from "lucide-react"

import InterviewExperienceForm from "@/components/InterviewExperienceForm"
import { QuestionCard } from "@/components/practice/QuestionCard"
import { QuestionFilters } from "@/components/practice/QuestionFilters"
import { QuestionProgressSummary } from "@/components/practice/QuestionProgressSummary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { allQuestionDifficulties, allQuestionRounds, allQuestionTopics, practiceQuestionsByCompany } from "@/data/questions"
import { filterPracticeQuestions, isPracticeCompanySlug } from "@/data/questions/utils"
import type { CompanySlug, InterviewRound, QuestionDifficulty, QuestionTopic } from "@/data/types"
import { useQuestionProgress } from "@/hooks/use-question-progress"
import type { CompanyDetail } from "@/types/company"

type CompanyPrepContentProps = {
  company: CompanyDetail
  companySlug: string
}

export function CompanyPrepContent({
  company,
  companySlug,
}: CompanyPrepContentProps) {
  const supportedCompany = isPracticeCompanySlug(companySlug)
  const practiceCompanySlug: CompanySlug | null = supportedCompany ? companySlug : null

  const questionSet = practiceCompanySlug ? practiceQuestionsByCompany[practiceCompanySlug] : []
  const [activeTab, setActiveTab] = useState("overview")
  const [roundFilter, setRoundFilter] = useState<InterviewRound | "All">("All")
  const [difficultyFilter, setDifficultyFilter] = useState<QuestionDifficulty | "All">("All")
  const [topicFilter, setTopicFilter] = useState<QuestionTopic | "All">("All")

  const progress = useQuestionProgress(questionSet)

  const filteredQuestions = useMemo(() => {
    return filterPracticeQuestions(questionSet, {
      round: roundFilter,
      difficulty: difficultyFilter,
      topic: topicFilter,
    })
  }, [questionSet, roundFilter, difficultyFilter, topicFilter])

  const jumpToRoundQuestions = (round: InterviewRound) => {
    setRoundFilter(round)
    setActiveTab("questions")
  }

  const resolveMappedRound = (roundTitle: string): InterviewRound | null => {
    const normalized = roundTitle.toLowerCase()

    if (normalized.includes("online")) return "Online Assessment"
    if (normalized.includes("technical round 1")) return "Technical Round 1"
    if (normalized.includes("technical round 2")) return "Technical Round 2"
    if (normalized.includes("behavioral") || normalized.includes("googlyness") || normalized.includes("managerial")) {
      return "Behavioral"
    }
    if (normalized.includes("hiring committee")) return "Hiring Committee"

    return null
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
          {company.interviewRounds.map((round) => (
            <Card key={round.title} className="border shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl">{round.title}</CardTitle>
                    <CardDescription className="mt-2">{round.focus}</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{round.duration}</Badge>
                    {supportedCompany && resolveMappedRound(round.title) && (
                      <Button variant="outline" onClick={() => jumpToRoundQuestions(resolveMappedRound(round.title)!)}>
                        Study This Round
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {round.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
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
        {supportedCompany ? (
          <>
            <QuestionProgressSummary
              title={`${company.name} Practice Progress`}
              solved={progress.summary.solved}
              attempted={progress.summary.attempted}
              bookmarked={progress.summary.bookmarked}
              total={progress.summary.total}
              easySolved={progress.summary.easySolved}
              mediumSolved={progress.summary.mediumSolved}
              hardSolved={progress.summary.hardSolved}
            />

            <QuestionFilters
              round={roundFilter}
              difficulty={difficultyFilter}
              topic={topicFilter}
              rounds={allQuestionRounds}
              difficulties={allQuestionDifficulties}
              topics={allQuestionTopics}
              onRoundChange={setRoundFilter}
              onDifficultyChange={setDifficultyFilter}
              onTopicChange={setTopicFilter}
            />

            <div className="grid gap-6 xl:grid-cols-2">
              {filteredQuestions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  solved={progress.isSolved(question.id)}
                  attempted={progress.isAttempted(question.id)}
                  bookmarked={progress.isBookmarked(question.id)}
                  onSolvedToggle={() => progress.toggleSolved(question.id)}
                  onAttemptedToggle={() => progress.toggleAttempted(question.id)}
                  onBookmarkedToggle={() => progress.toggleBookmarked(question.id)}
                />
              ))}
            </div>

            {filteredQuestions.length === 0 && (
              <Card className="border shadow-sm">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">
                    No questions match the current filter combination. Try changing round, difficulty, or topic.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                A fully seeded question bank is currently available only for Google and Microsoft in this demo slice.
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
