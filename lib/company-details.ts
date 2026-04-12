import companiesData from "@/data/companies.json"
import resourcesData from "@/data/resources.json"
import { getQuestionsByCompany } from "@/data/companies"
import type { CompanyDetail } from "@/types/company"

type CompanyRecord = {
  id: string
  name: string
  tier: CompanyDetail["tier"]
  roles: string[]
  openings: number
  salaryRange: string
  growth: number
  location: string
  difficulty: CompanyDetail["difficulty"]
  intro: string
  focusAreas: string[]
}

function toCompanyDetail(company: CompanyRecord): CompanyDetail {
  const codingQuestions = getQuestionsByCompany(company.id, "coding")
  const behavioralQuestions = getQuestionsByCompany(company.id, "behavioral")

  return {
    name: company.name,
    slug: company.id,
    tier: company.tier,
    roles: company.roles,
    openings: company.openings,
    salaryRange: company.salaryRange,
    growth: company.growth,
    location: company.location,
    difficulty: company.difficulty,
    intro: company.intro,
    overview: [
      `${company.name} is represented in PlacePrep with data-driven practice tracks rather than static company copy.`,
      `Current focus areas include ${company.focusAreas.join(", ")}.`,
      "Use the company page to jump into coding, behavioral practice, and resume alignment.",
    ],
    eligibility: [
      "Comfort with the role-aligned foundations shown on this company page",
      "Ability to explain decisions clearly under interview pressure",
      "Prepared examples for ownership, teamwork, and problem solving",
    ],
    onlineAssessment: {
      format: `${company.name} typically screens with role-specific coding, behavioral, or practical problem-solving rounds depending on the role.`,
      topics: company.focusAreas,
      tips: [
        "Prioritize clarity first, then optimization.",
        "Prepare two or three measurable project stories.",
        "Practice under time pressure so your communication stays calm.",
      ],
    },
    interviewRounds: [
      {
        title: "Online Assessment",
        duration: "45-90 min",
        focus: "Foundational screening across coding, reasoning, or aptitude",
        details: [
          "Expect a mix of role-specific fundamentals.",
          "Correctness, pacing, and clear problem solving matter most at this stage.",
        ],
      },
      {
        title: "Technical Round 1",
        duration: "45-60 min",
        focus: "Core implementation and reasoning",
        details: [
          "Expect coding, project deep-dives, or architecture reasoning depending on the role.",
          "Strong communication and tradeoff discussion can materially improve your signal.",
        ],
      },
      {
        title: "Behavioral",
        duration: "30-45 min",
        focus: "Ownership, collaboration, and judgment",
        details: [
          "Use STAR format and highlight your direct contribution.",
          "End with measurable result or clear learning when possible.",
        ],
      },
    ],
    questionBank: [
      {
        title: "Coding",
        questions: codingQuestions.slice(0, 6).map((question) => ({
          question: question.title,
          round: "Technical Round 1",
          difficulty: question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1) as "Easy" | "Medium" | "Hard",
          whatToFocusOn: `Practice the core ${question.topic.toLowerCase()} pattern and be ready to explain complexity clearly.`,
          answerOutline: [
            "State the naive baseline first.",
            "Identify the data structure or pattern that improves the solution.",
            "Walk through one representative example.",
            "Finish with time and space complexity.",
          ],
        })),
      },
      {
        title: "Behavioral",
        questions: behavioralQuestions.slice(0, 6).map((question) => ({
          question,
          round: "Behavioral",
          difficulty: "Medium" as const,
          whatToFocusOn: "Keep your answer structured, personal, and outcome-focused.",
          answerOutline: [
            "Situation",
            "Task",
            "Action",
            "Result",
          ],
        })),
      },
    ],
    preparationTips: [
      `Use ${company.name}-tagged coding questions to practice the most common patterns first.`,
      "Review your last few AI feedback items before retrying the same category.",
      "Keep one resume version aligned to the role and company you are targeting.",
    ],
    resources: resourcesData.slice(0, 3).map((resource) => ({
      label: resource.title,
      href: resource.href,
      type: resource.href.startsWith("/") ? "Internal" : "External",
    })),
    lastUpdated: "April 12, 2026",
  }
}

export const companyDetails: CompanyDetail[] = (companiesData as unknown as CompanyRecord[]).map(toCompanyDetail)

export const companyDetailsBySlug = Object.fromEntries(
  companyDetails.map((company) => [company.slug, company])
) as Record<string, CompanyDetail>

export const supportedCompanySlugs = companyDetails.map((company) => company.slug)
