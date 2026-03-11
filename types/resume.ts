export type Resume = {
  personalInfo: {
    fullName: string
    email: string
    phone: string
    linkedin: string
    github: string
    location: string
  }

  summary: string

  education: {
    institution: string
    degree: string
    year: string
    grade: string
  }[]

  projects: {
    title: string
    description: string
    technologies: string
  }[]

  certifications: string[]

  achievements: string[]

  technicalSkills: {
    languages: string[]
    frameworks: string[]
    tools: string[]
    cloud: string[]
    concepts: string[]
  }

  interests: string[]

  strengths: string[]
}