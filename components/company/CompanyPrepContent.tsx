"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BookOpen, Briefcase, Building2, FileQuestion, Layers3, Sparkles } from "lucide-react"

import { BehavioralFilters } from "@/components/behavioral/BehavioralFilters"
import { BehavioralProgressSummary } from "@/components/behavioral/BehavioralProgressSummary"
import { BehavioralQuestionCard } from "@/components/behavioral/BehavioralQuestionCard"
import InterviewExperienceForm from "@/components/InterviewExperienceForm"
import { QuestionCard } from "@/components/practice/QuestionCard"
import { QuestionFilters } from "@/components/practice/QuestionFilters"
import { QuestionProgressSummary } from "@/components/practice/QuestionProgressSummary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  allBehavioralCategories,
  allBehavioralFrequencies,
  behavioralQuestionsByCompany,
  filterBehavioralQuestions,
} from "@/data/behavioral"
import { allQuestionDifficulties, allQuestionRounds, allQuestionTopics, practiceQuestionsByCompany } from "@/data/questions"
import { filterPracticeQuestions, isPracticeCompanySlug } from "@/data/questions/utils"
import type {
  BehavioralCategory,
  CompanySlug,
  InterviewRound,
  QuestionDifficulty,
  QuestionFrequency,
  QuestionTopic,
} from "@/data/types"
import { useBehavioralProgress } from "@/hooks/use-behavioral-progress"
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
  const [questionMode, setQuestionMode] = useState<"technical" | "behavioral">("technical")
  const [roundFilter, setRoundFilter] = useState<InterviewRound | "All">("All")
  const [difficultyFilter, setDifficultyFilter] = useState<QuestionDifficulty | "All">("All")
  const [topicFilter, setTopicFilter] = useState<QuestionTopic | "All">("All")
  const [behavioralCategoryFilter, setBehavioralCategoryFilter] = useState<BehavioralCategory | "All">("All")
  const [behavioralFrequencyFilter, setBehavioralFrequencyFilter] = useState<QuestionFrequency | "All">("All")

  const progress = useQuestionProgress(questionSet)
  const behavioralQuestionSet = practiceCompanySlug ? behavioralQuestionsByCompany[practiceCompanySlug] : []
  const behavioralProgress = useBehavioralProgress(behavioralQuestionSet)

  const filteredQuestions = useMemo(() => {
    return filterPracticeQuestions(questionSet, {
      round: roundFilter,
      difficulty: difficultyFilter,
      topic: topicFilter,
    })
  }, [questionSet, roundFilter, difficultyFilter, topicFilter])

  const filteredBehavioralQuestions = useMemo(() => {
    return filterBehavioralQuestions(behavioralQuestionSet, {
      category: behavioralCategoryFilter,
      frequency: behavioralFrequencyFilter,
    })
  }, [behavioralQuestionSet, behavioralCategoryFilter, behavioralFrequencyFilter])

  const jumpToRoundQuestions = (round: InterviewRound) => {
    setRoundFilter(round)
    setQuestionMode(round === "Behavioral" ? "behavioral" : "technical")
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
            <Card className="border shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Question Bank Mode</p>
                  <h3 className="mt-1 text-lg font-semibold">Choose your prep lane</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Keep technical coding prep and behavioral storytelling prep separate, so each view stays focused.
                  </p>
                </div>
                <ToggleGroup
                  type="single"
                  value={questionMode}
                  onValueChange={(value) => value && setQuestionMode(value as "technical" | "behavioral")}
                  className="justify-start rounded-2xl border bg-muted/30 p-1"
                >
                  <ToggleGroupItem value="technical" variant="outline" className="rounded-xl px-4">
                    Technical Questions
                  </ToggleGroupItem>
                  <ToggleGroupItem value="behavioral" variant="outline" className="rounded-xl px-4">
                    Behavioral Questions
                  </ToggleGroupItem>
                </ToggleGroup>
              </CardContent>
            </Card>

            {questionMode === "technical" ? (
              <>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Technical Question Bank</p>
                  <h3 className="text-2xl font-semibold tracking-tight">Coding rounds, DSA patterns, and company-style technical practice</h3>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    This lane keeps the existing technical flow intact with round, difficulty, and topic filters.
                  </p>
                </div>

                <QuestionProgressSummary
                  title={`${company.name} Technical Progress`}
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
                        No technical questions match the current filter combination. Try changing round, difficulty, or topic.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Behavioral Question Bank</p>
                  <h3 className="text-2xl font-semibold tracking-tight">Company-specific stories, interviewer signals, and STAR prep</h3>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    This lane is dedicated to behavioral prompts only, with category-based filtering and separate progress tracking.
                  </p>
                </div>

                <BehavioralProgressSummary
                  title={`${company.name} Behavioral Prep Progress`}
                  prepared={behavioralProgress.summary.prepared}
                  bookmarked={behavioralProgress.summary.bookmarked}
                  total={behavioralProgress.summary.total}
                  categoryCounts={behavioralProgress.summary.categoryCounts}
                />

                <BehavioralFilters
                  category={behavioralCategoryFilter}
                  frequency={behavioralFrequencyFilter}
                  categories={allBehavioralCategories}
                  frequencies={allBehavioralFrequencies}
                  onCategoryChange={setBehavioralCategoryFilter}
                  onFrequencyChange={setBehavioralFrequencyFilter}
                />

                <div className="grid gap-6 xl:grid-cols-2">
                  {filteredBehavioralQuestions.map((question) => (
                    <BehavioralQuestionCard
                      key={question.id}
                      question={question}
                      prepared={behavioralProgress.isPrepared(question.id)}
                      bookmarked={behavioralProgress.isBookmarked(question.id)}
                      onPreparedToggle={() => behavioralProgress.togglePrepared(question.id)}
                      onBookmarkedToggle={() => behavioralProgress.toggleBookmarked(question.id)}
                    />
                  ))}
                </div>

                {filteredBehavioralQuestions.length === 0 && (
                  <Card className="border shadow-sm">
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground">
                        No behavioral prompts match the current filters. Try changing category or frequency.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
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
