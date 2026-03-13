"use client"

import { useMemo, useState } from "react"

import { QuestionCard } from "@/components/practice/QuestionCard"
import { QuestionFilters } from "@/components/practice/QuestionFilters"
import { QuestionProgressSummary } from "@/components/practice/QuestionProgressSummary"
import { allQuestionDifficulties, allQuestionRounds, allQuestionTopics, practiceQuestions } from "@/data/questions"
import { filterPracticeQuestions } from "@/data/questions/utils"
import type { InterviewRound, QuestionDifficulty, QuestionTopic } from "@/data/types"
import { useQuestionProgress } from "@/hooks/use-question-progress"

export default function PracticePage() {
  const [roundFilter, setRoundFilter] = useState<InterviewRound | "All">("All")
  const [difficultyFilter, setDifficultyFilter] = useState<QuestionDifficulty | "All">("All")
  const [topicFilter, setTopicFilter] = useState<QuestionTopic | "All">("All")

  const progress = useQuestionProgress(practiceQuestions)

  const filteredQuestions = useMemo(() => {
    return filterPracticeQuestions(practiceQuestions, {
      round: roundFilter,
      difficulty: difficultyFilter,
      topic: topicFilter,
    })
  }, [roundFilter, difficultyFilter, topicFilter])

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Practice Questions</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          A focused Google and Microsoft interview prep set with real representative questions, structured
          prompts, and local progress tracking.
        </p>
      </div>

      <QuestionProgressSummary
        title="Overall Practice Progress"
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
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          No questions match the selected filters yet.
        </div>
      )}
    </main>
  )
}
