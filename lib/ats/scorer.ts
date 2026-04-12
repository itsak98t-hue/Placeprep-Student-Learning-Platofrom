import { evaluateBulletStrength, splitBullets } from "@/lib/ats/contentStrength"
import { extractJobKeywords, matchKeywords, sanitizeText } from "@/lib/ats/keywordMatcher"
import { getRoleKeywords, scoreRoleRelevance } from "@/lib/ats/roleRelevance"
import {
  filterNonEmptyItems,
  getFilledEducation,
  getFilledExperience,
  getFilledProjects,
  getSkillGroups,
  hasPersonalInfo,
  isNonEmpty,
} from "@/lib/resume"
import type { Resume } from "@/types/resume"
import type { ATSAnalysisResult } from "@/types/resume-analysis"

function buildResumeText(resume: Resume) {
  return sanitizeText(
    [
      resume.title,
      resume.targetRole,
      resume.targetCompany,
      Object.values(resume.personalInfo).join(" "),
      resume.summary,
      getFilledEducation(resume)
        .map((entry) => [entry.institution, entry.degree, entry.year, entry.grade].join(" "))
        .join(" "),
      getFilledExperience(resume)
        .map((entry) => [entry.company, entry.role, entry.duration, entry.location, entry.description].join(" "))
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

function getProjectAndExperienceBullets(resume: Resume): string[] {
  const experienceBullets = getFilledExperience(resume).flatMap((entry) => splitBullets(entry.description))
  const projectBullets = getFilledProjects(resume).flatMap((project) => splitBullets(project.description))
  return [...experienceBullets, ...projectBullets]
}

function scoreSectionCompleteness(resume: Resume): number {
  let score = 0
  if (hasPersonalInfo(resume)) score += 4
  if (isNonEmpty(resume.summary)) score += 3
  if (getFilledEducation(resume).length > 0) score += 3
  if (getSkillGroups(resume).length > 0) score += 4
  if (getFilledProjects(resume).length > 0) score += 3
  if (getFilledExperience(resume).length > 0) score += 2
  if (filterNonEmptyItems(resume.certifications).length > 0) score += 1
  return Math.min(20, score)
}

function scoreFormattingSafety(resume: Resume): number {
  let score = 15
  if (!hasPersonalInfo(resume)) score -= 4
  if (!isNonEmpty(resume.summary)) score -= 2
  if (getFilledProjects(resume).length === 0 && getFilledExperience(resume).length === 0) score -= 4

  const longParagraphPenalty = getProjectAndExperienceBullets(resume).some(
    (bullet) => bullet.split(/\s+/).length > 40
  )
  if (longParagraphPenalty) score -= 2

  if (getSkillGroups(resume).length === 0) score -= 3
  return Math.max(0, score)
}

function buildSuggestions(
  resume: Resume,
  targetRole: string,
  missingKeywords: string[],
  weakBullets: string[],
  quantifiedImpactScore: number,
  contentStrengthScore: number
): string[] {
  const suggestions: string[] = []

  if (!isNonEmpty(resume.summary)) {
    suggestions.push("Add a concise summary that names your target role and strongest technical areas.")
  }

  if (getFilledExperience(resume).length === 0) {
    suggestions.push("Add internship, freelance, or campus experience entries to strengthen role relevance.")
  }

  if (missingKeywords.length > 0) {
    suggestions.push(`Add relevant job-description keywords where truthful, such as ${missingKeywords.slice(0, 5).join(", ")}.`)
  }

  if (weakBullets.length > 0) {
    suggestions.push("Rewrite weak bullets to start with action verbs and include tools, scope, or outcomes.")
  }

  if (quantifiedImpactScore < 6) {
    suggestions.push("Add measurable outcomes like percentages, counts, users, speedups, or reductions.")
  }

  if (contentStrengthScore < 10) {
    suggestions.push("Make project and experience bullets more specific by naming technologies and the exact feature or result.")
  }

  const roleKeywords = getRoleKeywords(targetRole)
  if (!roleKeywords.some((keyword) => buildResumeText(resume).includes(keyword))) {
    suggestions.push(`Align the resume more clearly to a ${targetRole} path with directly relevant tools and project language.`)
  }

  return suggestions.slice(0, 6)
}

export function analyzeResume(
  resume: Resume,
  jobDescription: string,
  targetRole: string
): ATSAnalysisResult {
  const resumeText = buildResumeText(resume)
  const jobKeywords = extractJobKeywords(jobDescription)
  const keywordMatches = matchKeywords(resumeText, jobKeywords)
  const bullets = getProjectAndExperienceBullets(resume)
  const bulletStrength = evaluateBulletStrength(bullets)

  const sectionCompleteness = scoreSectionCompleteness(resume)
  const keywordMatch = jobKeywords.length > 0 ? Math.round((keywordMatches.coverage / 100) * 30) : 18
  const formattingSafety = scoreFormattingSafety(resume)
  const contentStrength =
    bullets.length > 0 ? Math.min(15, Math.round((bulletStrength.strongBulletCount / bullets.length) * 15)) : 4
  const quantifiedImpact =
    bullets.length > 0 ? Math.min(10, Math.round((bulletStrength.quantifiedBulletCount / bullets.length) * 10)) : 2
  const roleRelevance = scoreRoleRelevance(resumeText, targetRole)

  const overallScore = Math.min(
    100,
    sectionCompleteness + keywordMatch + formattingSafety + contentStrength + quantifiedImpact + roleRelevance
  )

  return {
    overallScore,
    breakdown: {
      sectionCompleteness,
      keywordMatch,
      formattingSafety,
      contentStrength,
      quantifiedImpact,
      roleRelevance,
    },
    missingKeywords: keywordMatches.missingKeywords,
    matchedKeywords: keywordMatches.matchedKeywords,
    weakBullets: bulletStrength.weakBullets.slice(0, 6),
    suggestions: buildSuggestions(
      resume,
      targetRole,
      keywordMatches.missingKeywords,
      bulletStrength.weakBullets,
      quantifiedImpact,
      contentStrength
    ),
    keywordCoverage: keywordMatches.coverage,
  }
}
