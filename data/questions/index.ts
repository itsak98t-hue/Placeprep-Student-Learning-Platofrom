import questionsData from "@/data/questions.json"
import companiesData from "@/data/companies.json"
import type {
  CompanySlug,
  InterviewRound,
  PracticeQuestion,
  QuestionDifficulty,
  QuestionFrequency,
  QuestionTopic,
} from "@/data/types"

type CodingQuestionRecord = {
  id: string
  title: string
  company: CompanySlug
  difficulty: QuestionDifficulty
  topic: QuestionTopic
  round: InterviewRound
  frequency: QuestionFrequency
  link: string
}

const codingQuestions = questionsData.coding as CodingQuestionRecord[]

function buildPracticeQuestion(question: CodingQuestionRecord): PracticeQuestion {
  return {
    id: question.id,
    slug: question.id,
    title: question.title,
    company: question.company,
    round: question.round,
    topic: question.topic,
    difficulty: question.difficulty,
    frequency: question.frequency,
    sourceLabel: "Question dataset",
    shortDescription: `${question.title} is a ${question.difficulty.toLowerCase()} ${question.topic.toLowerCase()} question commonly seen in ${question.company} prep.`,
    fullPrompt: `Solve ${question.title} and explain your reasoning, edge cases, and final complexity.`,
    whyItMatters: `This problem helps build ${question.topic.toLowerCase()} instincts and mirrors interview pressure for ${question.company}.`,
    hints: [
      "Start with the brute-force version so your tradeoff reasoning is visible.",
      "Call out the data structure or pattern that reduces time complexity.",
      "Finish with time and space complexity plus one edge case.",
    ],
    approach: `Aim for the standard ${question.topic.toLowerCase()} pattern here and keep the explanation interview-friendly before coding.`,
    testCases: [
      {
        input: "Base case / smallest valid input",
        output: "Correct minimal-case output",
      },
      {
        input: "Typical case",
        output: "Expected output after applying the optimized approach",
      },
    ],
    starterCode: {
      javascript: `function solve(input) {\n  // TODO: implement ${question.title}\n  return input\n}`,
      python: `def solve(input_data):\n    # TODO: implement ${question.title}\n    return input_data`,
      java: `class Solution {\n    public Object solve(Object input) {\n        // TODO: implement ${question.title}\n        return input;\n    }\n}`,
    },
  }
}

export const practiceQuestions: PracticeQuestion[] = codingQuestions.map(buildPracticeQuestion)

export const practiceQuestionsByCompany = practiceQuestions.reduce<Record<CompanySlug, PracticeQuestion[]>>(
  (accumulator, question) => {
    accumulator[question.company].push(question)
    return accumulator
  },
  Object.fromEntries(
    companiesData.map((company) => [company.id, []])
  ) as unknown as Record<CompanySlug, PracticeQuestion[]>
)

export const practiceQuestionsById = Object.fromEntries(
  practiceQuestions.map((question) => [question.id, question])
) as Record<string, PracticeQuestion>

export const allQuestionRounds: Array<InterviewRound | "All"> = [
  "All",
  "Online Assessment",
  "Technical Round 1",
  "Technical Round 2",
  "Behavioral",
  "Hiring Committee",
]

export const allQuestionDifficulties: Array<QuestionDifficulty | "All"> = [
  "All",
  "Easy",
  "Medium",
  "Hard",
]

export const allQuestionTopics: Array<QuestionTopic | "All"> = [
  "All",
  "Arrays",
  "Strings",
  "Hashing",
  "Linked List",
  "Stack",
  "Queue",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "Binary Search",
  "Intervals",
  "Greedy",
  "Recursion",
  "System Design",
  "Behavioral",
]
