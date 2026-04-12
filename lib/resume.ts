import type { Resume, ResumeCore, ResumeEducation, ResumeExperience, ResumeInput, ResumeProject, ResumeSkills } from "@/types/resume"

export const emptyResumeCore: ResumeCore = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    location: "",
  },
  summary: "",
  education: [
    {
      institution: "",
      degree: "",
      year: "",
      grade: "",
    },
  ],
  experience: [
    {
      company: "",
      role: "",
      duration: "",
      location: "",
      description: "",
    },
  ],
  projects: [
    {
      title: "",
      description: "",
      technologies: "",
    },
  ],
  skills: {
    languages: [],
    frameworks: [],
    tools: [],
    cloud: [],
    concepts: [],
  },
  certifications: [],
  achievements: [],
  interests: [],
  strengths: [],
}

export const emptyResume: Resume = {
  id: undefined,
  title: "Untitled Resume",
  targetRole: "Software Developer",
  targetCompany: "",
  template: "ats-default",
  isDefault: true,
  score: 0,
  createdAt: undefined,
  updatedAt: undefined,
  ...emptyResumeCore,
}

export function createEmptyResume(title = "Untitled Resume"): ResumeInput {
  return {
    ...emptyResumeCore,
    title,
    targetRole: emptyResume.targetRole,
    targetCompany: "",
    template: emptyResume.template,
    isDefault: false,
  }
}

function normalizeEducationEntries(entries: unknown): ResumeEducation[] {
  return Array.isArray(entries) && entries.length > 0
    ? entries.map((entry) => ({
        institution: typeof entry?.institution === "string" ? entry.institution : "",
        degree: typeof entry?.degree === "string" ? entry.degree : "",
        year: typeof entry?.year === "string" ? entry.year : "",
        grade: typeof entry?.grade === "string" ? entry.grade : "",
      }))
    : emptyResumeCore.education
}

function normalizeExperienceEntries(entries: unknown): ResumeExperience[] {
  return Array.isArray(entries) && entries.length > 0
    ? entries.map((entry) => ({
        company: typeof entry?.company === "string" ? entry.company : "",
        role: typeof entry?.role === "string" ? entry.role : "",
        duration: typeof entry?.duration === "string" ? entry.duration : "",
        location: typeof entry?.location === "string" ? entry.location : "",
        description: typeof entry?.description === "string" ? entry.description : "",
      }))
    : emptyResumeCore.experience
}

function normalizeProjectEntries(entries: unknown): ResumeProject[] {
  return Array.isArray(entries) && entries.length > 0
    ? entries.map((entry) => ({
        title: typeof entry?.title === "string" ? entry.title : "",
        description: typeof entry?.description === "string" ? entry.description : "",
        technologies: typeof entry?.technologies === "string" ? entry.technologies : "",
      }))
    : emptyResumeCore.projects
}

function normalizeSkills(value: unknown): ResumeSkills {
  const legacyValue = (value ?? {}) as Partial<ResumeSkills> & { technicalSkills?: Partial<ResumeSkills> }
  const source = legacyValue.technicalSkills ?? legacyValue

  return {
    languages: Array.isArray(source.languages) ? source.languages : [],
    frameworks: Array.isArray(source.frameworks) ? source.frameworks : [],
    tools: Array.isArray(source.tools) ? source.tools : [],
    cloud: Array.isArray(source.cloud) ? source.cloud : [],
    concepts: Array.isArray(source.concepts) ? source.concepts : [],
  }
}

export function normalizeResume(data: Partial<Resume> | undefined, id?: string): Resume {
  const candidate = (data ?? {}) as Partial<Resume> & { technicalSkills?: Partial<ResumeSkills> }

  return {
    ...emptyResume,
    ...candidate,
    id: id ?? candidate.id,
    title: typeof candidate.title === "string" && candidate.title.trim() ? candidate.title : emptyResume.title,
    targetRole:
      typeof candidate.targetRole === "string" && candidate.targetRole.trim()
        ? candidate.targetRole
        : emptyResume.targetRole,
    targetCompany: typeof candidate.targetCompany === "string" ? candidate.targetCompany : "",
    template: typeof candidate.template === "string" ? candidate.template : emptyResume.template,
    isDefault: Boolean(candidate.isDefault),
    score: typeof candidate.score === "number" ? candidate.score : 0,
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : undefined,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : undefined,
    personalInfo: {
      ...emptyResume.personalInfo,
      ...(candidate.personalInfo ?? {}),
    },
    summary: typeof candidate.summary === "string" ? candidate.summary : "",
    education: normalizeEducationEntries(candidate.education),
    experience: normalizeExperienceEntries(candidate.experience),
    projects: normalizeProjectEntries(candidate.projects),
    skills: normalizeSkills(candidate.skills ?? candidate.technicalSkills),
    certifications: Array.isArray(candidate.certifications) ? candidate.certifications : [],
    achievements: Array.isArray(candidate.achievements) ? candidate.achievements : [],
    interests: Array.isArray(candidate.interests) ? candidate.interests : [],
    strengths: Array.isArray(candidate.strengths) ? candidate.strengths : [],
  }
}

export function stringToArray(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function arrayToMultiline(value?: string[]) {
  if (!Array.isArray(value) || value.length === 0) {
    return ""
  }

  return value.join("\n")
}

export function isNonEmpty(value?: string | null) {
  return Boolean(value?.trim())
}

export function filterNonEmptyItems(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean)
}

export function hasPersonalInfo(resume: Resume) {
  return Object.values(resume.personalInfo).some((value) => isNonEmpty(value))
}

export function getSkillGroups(resume: Resume) {
  const groups = [
    { label: "Languages", values: filterNonEmptyItems(resume.skills.languages) },
    { label: "Frameworks", values: filterNonEmptyItems(resume.skills.frameworks) },
    { label: "Tools", values: filterNonEmptyItems(resume.skills.tools) },
    { label: "Cloud", values: filterNonEmptyItems(resume.skills.cloud) },
    { label: "Concepts", values: filterNonEmptyItems(resume.skills.concepts) },
  ]

  return groups.filter((group) => group.values.length > 0)
}

export function getFilledProjects(resume: Resume) {
  return resume.projects.filter((project) =>
    [project.title, project.description, project.technologies].some((value) => isNonEmpty(value))
  )
}

export function getFilledEducation(resume: Resume) {
  return resume.education.filter((education) =>
    [education.institution, education.degree, education.year, education.grade].some((value) =>
      isNonEmpty(value)
    )
  )
}

export function getFilledExperience(resume: Resume) {
  return resume.experience.filter((experience) =>
    [experience.company, experience.role, experience.duration, experience.location, experience.description].some((value) =>
      isNonEmpty(value)
    )
  )
}

export function getContactLine(resume: Resume) {
  return [
    resume.personalInfo.email,
    resume.personalInfo.phone,
    resume.personalInfo.location,
    resume.personalInfo.linkedin,
    resume.personalInfo.github,
  ]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" | ")
}

export function resumeHasContent(resume: Resume) {
  return (
    hasPersonalInfo(resume) ||
    isNonEmpty(resume.summary) ||
    getSkillGroups(resume).length > 0 ||
    getFilledExperience(resume).length > 0 ||
    getFilledProjects(resume).length > 0 ||
    getFilledEducation(resume).length > 0 ||
    filterNonEmptyItems(resume.certifications).length > 0 ||
    filterNonEmptyItems(resume.achievements).length > 0 ||
    filterNonEmptyItems(resume.interests).length > 0 ||
    filterNonEmptyItems(resume.strengths).length > 0
  )
}

export function getResumeListItemLabel(resume: Resume) {
  const companySuffix = isNonEmpty(resume.targetCompany) ? ` • ${resume.targetCompany.trim()}` : ""
  return `${resume.targetRole}${companySuffix}`
}
