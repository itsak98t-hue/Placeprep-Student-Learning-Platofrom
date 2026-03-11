import type { Resume } from "@/types/resume"

export const emptyResume: Resume = {
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
  projects: [
    {
      title: "",
      description: "",
      technologies: "",
    },
  ],
  certifications: [],
  achievements: [],
  technicalSkills: {
    languages: [],
    frameworks: [],
    tools: [],
    cloud: [],
    concepts: [],
  },
  interests: [],
  strengths: [],
}

export function normalizeResume(data: Partial<Resume> | undefined): Resume {
  return {
    ...emptyResume,
    ...data,
    personalInfo: {
      ...emptyResume.personalInfo,
      ...(data?.personalInfo || {}),
    },
    education:
      Array.isArray(data?.education) && data.education.length > 0
        ? data.education
        : emptyResume.education,
    projects:
      Array.isArray(data?.projects) && data.projects.length > 0
        ? data.projects
        : emptyResume.projects,
    certifications: Array.isArray(data?.certifications) ? data.certifications : [],
    achievements: Array.isArray(data?.achievements) ? data.achievements : [],
    technicalSkills: {
      ...emptyResume.technicalSkills,
      ...(data?.technicalSkills || {}),
      languages: Array.isArray(data?.technicalSkills?.languages)
        ? data.technicalSkills.languages
        : [],
      frameworks: Array.isArray(data?.technicalSkills?.frameworks)
        ? data.technicalSkills.frameworks
        : [],
      tools: Array.isArray(data?.technicalSkills?.tools) ? data.technicalSkills.tools : [],
      cloud: Array.isArray(data?.technicalSkills?.cloud) ? data.technicalSkills.cloud : [],
      concepts: Array.isArray(data?.technicalSkills?.concepts)
        ? data.technicalSkills.concepts
        : [],
    },
    interests: Array.isArray(data?.interests) ? data.interests : [],
    strengths: Array.isArray(data?.strengths) ? data.strengths : [],
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
    { label: "Languages", values: filterNonEmptyItems(resume.technicalSkills.languages) },
    { label: "Frameworks", values: filterNonEmptyItems(resume.technicalSkills.frameworks) },
    { label: "Tools", values: filterNonEmptyItems(resume.technicalSkills.tools) },
    { label: "Cloud", values: filterNonEmptyItems(resume.technicalSkills.cloud) },
    { label: "Concepts", values: filterNonEmptyItems(resume.technicalSkills.concepts) },
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
    getFilledProjects(resume).length > 0 ||
    getFilledEducation(resume).length > 0 ||
    filterNonEmptyItems(resume.certifications).length > 0 ||
    filterNonEmptyItems(resume.achievements).length > 0 ||
    filterNonEmptyItems(resume.interests).length > 0 ||
    filterNonEmptyItems(resume.strengths).length > 0
  )
}
