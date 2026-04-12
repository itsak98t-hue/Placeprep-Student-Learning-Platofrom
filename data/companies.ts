import companiesData from "@/data/companies.json"
import questionsData from "@/data/questions.json"
import type { CompanySlug } from "@/data/types"

export type CompanyQuestionType = "behavioral" | "coding"

export type CompanyCodingQuestion = {
  id: string
  title: string
  difficulty: "easy" | "medium" | "hard"
  link: string
  topic: string
}

export type CompanyBehavioralQuestion = string

export type CompanyQuestionSet = {
  behavioral: CompanyBehavioralQuestion[]
  coding: CompanyCodingQuestion[]
}

export type CompanyData = {
  id: CompanySlug
  name: string
  tier: 1 | 2 | 3
  roles: string[]
  openings: number
  salaryRange: string
  growth: number
  location: string
  difficulty: "Moderate" | "High" | "Very High"
  intro: string
  focusAreas: string[]
  questions: CompanyQuestionSet
}

const codingQuestionsByCompany = (questionsData.coding as Array<{
  id: string
  title: string
  difficulty: "Easy" | "Medium" | "Hard"
  company: CompanySlug
  link: string
  topic: string
}>).reduce<Record<CompanySlug, CompanyCodingQuestion[]>>((accumulator, question) => {
  accumulator[question.company] = accumulator[question.company] ?? []
  accumulator[question.company].push({
    id: question.id,
    title: question.title,
    difficulty: question.difficulty.toLowerCase() as CompanyCodingQuestion["difficulty"],
    link: question.link,
    topic: question.topic,
  })
  return accumulator
}, {} as Record<CompanySlug, CompanyCodingQuestion[]>)

const behavioralQuestionsByCompany = (questionsData.behavioral as Array<{
  company: CompanySlug
  question: string
}>).reduce<Record<CompanySlug, string[]>>((accumulator, question) => {
  accumulator[question.company] = accumulator[question.company] ?? []
  accumulator[question.company].push(question.question)
  return accumulator
}, {} as Record<CompanySlug, string[]>)

export const companies: CompanyData[] = (companiesData as Array<Omit<CompanyData, "questions">>).map((company) => ({
  ...company,
  questions: {
    behavioral: behavioralQuestionsByCompany[company.id] ?? [],
    coding: codingQuestionsByCompany[company.id] ?? [],
  },
}))

export function getCompanyById(id: string) {
  return companies.find((company) => company.id === id)
}

export function getQuestionsByCompany(id: string, type: "behavioral"): CompanyBehavioralQuestion[]
export function getQuestionsByCompany(id: string, type: "coding"): CompanyCodingQuestion[]
export function getQuestionsByCompany(id: string, type: CompanyQuestionType) {
  const company = getCompanyById(id)
  if (!company) {
    return []
  }

  return company.questions[type]
}
