import type { Resume } from "@/types/resume"
import type { ResumeAnalysis, ResumeSuggestion } from "@/types/resume-analysis"
import {
  filterNonEmptyItems,
  getFilledEducation,
  getFilledProjects,
  getSkillGroups,
  hasPersonalInfo,
  isNonEmpty,
} from "@/lib/resume"

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
  "you",
  "your",
  "will",
  "this",
  "have",
  "has",
  "our",
  "their",
  "they",
  "we",
  "using",
  "use",
  "role",
  "job",
  "experience",
  "work",
])

function sanitizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s/-]/g, " ")
}

function buildResumeText(resume: Resume) {
  return sanitizeText(
    [
      Object.values(resume.personalInfo).join(" "),
      resume.summary,
      getFilledEducation(resume)
        .map((entry) => [entry.institution, entry.degree, entry.year, entry.grade].join(" "))
        .join(" "),
      getFilledProjects(resume)
        .map((project) => [project.title, project.description, project.technologies].join(" "))
        .join(" "),
      filterNonEmptyItems(resume.certifications).join(" "),
      filterNonEmptyItems(resume.achievements).join(" "),
      filterNonEmptyItems(resume.interests).join(" "),
      filterNonEmptyItems(resume.strengths).join(" "),
      getSkillGroups(resume)
        .flatMap((group) => group.values)
        .join(" "),
    ].join(" ")
  )
}

export function extractJobKeywords(jobDescription: string) {
  const tokens = sanitizeText(jobDescription)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))

  const frequency = new Map<string, number>()

  for (const token of tokens) {
    frequency.set(token, (frequency.get(token) || 0) + 1)
  }

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20)
    .map(([token]) => token)
}

function buildHeuristicSuggestions(resume: Resume, missingKeywords: string[]) {
  const suggestions: ResumeSuggestion[] = []
  const projects = getFilledProjects(resume)
  const skills = getSkillGroups(resume)

  if (!isNonEmpty(resume.summary)) {
    suggestions.push({
      title: "Add a professional summary",
      detail: "A short summary helps ATS and recruiters quickly understand your target role, strengths, and domain focus.",
      severity: "high",
    })
  }

  if (projects.length === 0) {
    suggestions.push({
      title: "Add at least one strong project",
      detail: "Projects are often the clearest proof of applied skills for student and early-career resumes.",
      severity: "high",
    })
  } else if (projects.some((project) => !/\d/.test(project.description))) {
    suggestions.push({
      title: "Add measurable outcomes to projects",
      detail: "Try including metrics such as users, performance gains, accuracy, or delivery speed to strengthen project impact.",
      severity: "medium",
    })
  }

  if (skills.length === 0) {
    suggestions.push({
      title: "Expand technical skills",
      detail: "Grouped skill lists improve keyword coverage and make ATS parsing more reliable.",
      severity: "high",
    })
  }

  if (!hasPersonalInfo(resume) || !isNonEmpty(resume.personalInfo.fullName) || !isNonEmpty(resume.personalInfo.email)) {
    suggestions.push({
      title: "Complete the resume header",
      detail: "Make sure your name and primary email are present so the header is complete and recruiter-friendly.",
      severity: "high",
    })
  }

  if (missingKeywords.length > 0) {
    suggestions.push({
      title: "Align with job keywords",
      detail: `Consider naturally incorporating relevant terms such as ${missingKeywords.slice(0, 6).join(", ")} where they genuinely match your experience.`,
      severity: "medium",
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: "Refine wording for stronger impact",
      detail: "Your structure is solid. The next gains will come from sharper action verbs and more specific accomplishments.",
      severity: "low",
    })
  }

  return suggestions
}

export function analyzeResume(resume: Resume, jobDescription: string): ResumeAnalysis {
  const projects = getFilledProjects(resume)
  const education = getFilledEducation(resume)
  const skills = getSkillGroups(resume)
  const resumeText = buildResumeText(resume)
  const jobKeywords = extractJobKeywords(jobDescription)
  const matchedKeywords = jobKeywords.filter((keyword) => resumeText.includes(keyword))
  const missingKeywords = jobKeywords.filter((keyword) => !resumeText.includes(keyword))

  const headerScore = hasPersonalInfo(resume) ? 15 : 0
  const summaryScore = isNonEmpty(resume.summary) ? 15 : 0
  const skillsScore = Math.min(skills.length * 5, 20)
  const projectsScore = Math.min(projects.length * 10, 20)
  const educationScore = education.length > 0 ? 10 : 0
  const keywordCoverage = jobKeywords.length > 0 ? Math.round((matchedKeywords.length / jobKeywords.length) * 100) : 0
  const keywordScore = Math.round((keywordCoverage / 100) * 20)

  const score = Math.min(headerScore + summaryScore + skillsScore + projectsScore + educationScore + keywordScore, 100)

  return {
    score,
    keywordCoverage,
    matchedKeywords,
    missingKeywords,
    breakdown: [
      { label: "Header", score: headerScore, details: "Name and contact information" },
      { label: "Summary", score: summaryScore, details: "Professional overview section" },
      { label: "Skills", score: skillsScore, details: "Grouped ATS-readable technical skills" },
      { label: "Projects", score: projectsScore, details: "Project depth and quantity" },
      { label: "Education", score: educationScore, details: "Education section completeness" },
      { label: "Keyword Match", score: keywordScore, details: "Alignment with target job description" },
    ],
    suggestions: buildHeuristicSuggestions(resume, missingKeywords),
  }
}
