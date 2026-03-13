export type CompanySlug = "google" | "microsoft"

export type QuestionDifficulty = "Easy" | "Medium" | "Hard"

export type InterviewRound =
  | "Online Assessment"
  | "Technical Round 1"
  | "Technical Round 2"
  | "Behavioral"
  | "Hiring Committee"

export type QuestionTopic =
  | "Arrays"
  | "Strings"
  | "Hashing"
  | "Linked List"
  | "Stack"
  | "Queue"
  | "Trees"
  | "Graphs"
  | "Dynamic Programming"
  | "Binary Search"
  | "Intervals"
  | "Greedy"
  | "Recursion"
  | "Behavioral"

export type PracticeQuestion = {
  id: string
  slug: string
  title: string
  company: CompanySlug
  round: InterviewRound
  topic: QuestionTopic
  difficulty: QuestionDifficulty
  frequency: "High" | "Medium" | "Low"
  sourceLabel: string
  shortDescription: string
  fullPrompt: string
  whyItMatters: string
  hints: string[]
  approach: string
  testCases: {
    input: string
    output: string
    explanation?: string
  }[]
  starterCode?: {
    javascript?: string
    python?: string
    java?: string
  }
}
