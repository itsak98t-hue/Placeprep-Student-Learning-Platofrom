export type ResumeTemplateType = "ats-default"

export type ResumePersonalInfo = {
  fullName: string
  email: string
  phone: string
  linkedin: string
  github: string
  location: string
}

export type ResumeEducation = {
  institution: string
  degree: string
  year: string
  grade: string
}

export type ResumeExperience = {
  company: string
  role: string
  duration: string
  location: string
  description: string
}

export type ResumeProject = {
  title: string
  description: string
  technologies: string
}

export type ResumeSkills = {
  languages: string[]
  frameworks: string[]
  tools: string[]
  cloud: string[]
  concepts: string[]
}

export type ResumeCore = {
  personalInfo: ResumePersonalInfo
  summary: string
  education: ResumeEducation[]
  experience: ResumeExperience[]
  projects: ResumeProject[]
  skills: ResumeSkills
  certifications: string[]
  achievements: string[]
  interests: string[]
  strengths: string[]
}

export type ResumeInput = Partial<ResumeCore> & {
  title?: string
  targetRole?: string
  targetCompany?: string
  template?: ResumeTemplateType | string
  isDefault?: boolean
}

export type Resume = ResumeCore & {
  id?: string
  title: string
  targetRole: string
  targetCompany: string
  template: ResumeTemplateType | string
  isDefault: boolean
  score?: number
  createdAt?: string
  updatedAt?: string
}

export type ResumeListItem = Pick<
  Resume,
  "id" | "title" | "targetRole" | "targetCompany" | "template" | "isDefault" | "createdAt" | "updatedAt"
>
