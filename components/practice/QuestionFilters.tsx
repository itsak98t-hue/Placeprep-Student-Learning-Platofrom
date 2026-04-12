"use client"

import type { InterviewRound, QuestionDifficulty, QuestionTopic } from "@/data/types"

type QuestionFiltersProps = {
  round: InterviewRound | "All"
  difficulty: QuestionDifficulty | "All"
  topic: QuestionTopic | "All"
  rounds: Array<InterviewRound | "All">
  difficulties: Array<QuestionDifficulty | "All">
  topics: Array<QuestionTopic | "All">
  onRoundChange: (value: InterviewRound | "All") => void
  onDifficultyChange: (value: QuestionDifficulty | "All") => void
  onTopicChange: (value: QuestionTopic | "All") => void
}

export function QuestionFilters({
  round,
  difficulty,
  topic,
  rounds,
  difficulties,
  topics,
  onRoundChange,
  onDifficultyChange,
  onTopicChange,
}: QuestionFiltersProps) {
  return (
    <div className="grid gap-4 rounded-2xl border bg-card p-4 md:grid-cols-3">
      <FilterSelect label="Round" value={round} options={rounds} onChange={onRoundChange} />
      <FilterSelect label="Difficulty" value={difficulty} options={difficulties} onChange={onDifficultyChange} />
      <FilterSelect label="Topic" value={topic} options={topics} onChange={onTopicChange} />
    </div>
  )
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: T[]
  onChange: (value: T) => void
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
