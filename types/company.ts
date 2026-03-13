export type CompanyTier = 1 | 2 | 3

export type CompanyInterviewRound = {
  title: string
  duration: string
  focus: string
  details: string[]
}

export type CompanyQuestionCategory = {
  title: string
  questions: {
    question: string
    round: string
    difficulty: "Easy" | "Medium" | "Hard"
    whatToFocusOn: string
    answerOutline: string[]
  }[]
}

export type CompanyResource = {
  label: string
  href: string
  type: "Internal" | "External"
}

export type CompanyDetail = {
  name: string
  slug: string
  tier: CompanyTier
  roles: string[]
  openings: number
  salaryRange: string
  growth: number
  location: string
  difficulty: "Moderate" | "High" | "Very High"
  intro: string
  overview: string[]
  eligibility: string[]
  onlineAssessment: {
    format: string
    topics: string[]
    tips: string[]
  }
  interviewRounds: CompanyInterviewRound[]
  questionBank: CompanyQuestionCategory[]
  preparationTips: string[]
  resources: CompanyResource[]
  lastUpdated: string
}
