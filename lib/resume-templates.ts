export const DEFAULT_RESUME_TEMPLATE_ID = "ats-default"

export const resumeTemplates = [
  {
    id: DEFAULT_RESUME_TEMPLATE_ID,
    name: "ATS Default",
    description: "Single-column, print-friendly, ATS-safe layout.",
    atsSafe: true,
  },
] as const

export type ResumeTemplateId = (typeof resumeTemplates)[number]["id"]

export function isResumeTemplateId(value: string): value is ResumeTemplateId {
  return resumeTemplates.some((template) => template.id === value)
}
