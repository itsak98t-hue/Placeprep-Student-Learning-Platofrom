"use client"

import { memo, useEffect, useState } from "react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { arrayToMultiline, stringToArray } from "@/lib/resume"
import type { Resume } from "@/types/resume"

type ResumeEditorProps = {
  resume: Resume
  isSaving: boolean
  statusMessage?: string
  onChange: (resume: Resume) => void
  onSave: (resume: Resume) => void
  onPreview: () => void
}

function SectionField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export const ResumeEditor = memo(function ResumeEditor({
  resume,
  isSaving,
  statusMessage,
  onChange,
  onSave,
  onPreview,
}: ResumeEditorProps) {
  const [skillInputs, setSkillInputs] = useState({
    languages: arrayToMultiline(resume.skills.languages),
    frameworks: arrayToMultiline(resume.skills.frameworks),
    tools: arrayToMultiline(resume.skills.tools),
    cloud: arrayToMultiline(resume.skills.cloud),
    concepts: arrayToMultiline(resume.skills.concepts),
  })

  useEffect(() => {
    setSkillInputs({
      languages: arrayToMultiline(resume.skills.languages),
      frameworks: arrayToMultiline(resume.skills.frameworks),
      tools: arrayToMultiline(resume.skills.tools),
      cloud: arrayToMultiline(resume.skills.cloud),
      concepts: arrayToMultiline(resume.skills.concepts),
    })
  }, [
    resume.id,
    resume.skills.cloud,
    resume.skills.concepts,
    resume.skills.frameworks,
    resume.skills.languages,
    resume.skills.tools,
  ])

  const updateResume = (updater: (current: Resume) => Resume) => {
    onChange(updater(resume))
  }

  const updatePersonal = (field: keyof Resume["personalInfo"], value: string) => {
    updateResume((current) => ({
      ...current,
      personalInfo: {
        ...current.personalInfo,
        [field]: value,
      },
    }))
  }

  const updateSkills = (field: keyof Resume["skills"], value: string) => {
    setSkillInputs((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updateListField = (
    field: "certifications" | "achievements" | "interests" | "strengths",
    value: string
  ) => {
    updateResume((current) => ({
      ...current,
      [field]: stringToArray(value),
    }))
  }

  const buildResumeForSave = (): Resume => ({
    ...resume,
    skills: {
      languages: stringToArray(skillInputs.languages),
      frameworks: stringToArray(skillInputs.frameworks),
      tools: stringToArray(skillInputs.tools),
      cloud: stringToArray(skillInputs.cloud),
      concepts: stringToArray(skillInputs.concepts),
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">{resume.title}</h2>
          <p className="text-sm text-muted-foreground">
            Build and save company-specific resume versions without losing your other drafts.
          </p>
          {statusMessage && <p className="text-sm text-muted-foreground">{statusMessage}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => onSave(buildResumeForSave())} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Resume"}
          </Button>
          <Button onClick={onPreview} disabled={isSaving}>
            Open Preview
          </Button>
        </div>
      </div>

      <SectionCard title="Resume Settings" description="Name this resume and tailor it to a role or company.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SectionField label="Resume Title">
            <Input
              value={resume.title}
              onChange={(event) => updateResume((current) => ({ ...current, title: event.target.value }))}
              placeholder="Frontend Resume"
            />
          </SectionField>
          <SectionField label="Target Role">
            <Input
              value={resume.targetRole}
              onChange={(event) => updateResume((current) => ({ ...current, targetRole: event.target.value }))}
              placeholder="Software Developer"
            />
          </SectionField>
          <SectionField label="Target Company">
            <Input
              value={resume.targetCompany}
              onChange={(event) => updateResume((current) => ({ ...current, targetCompany: event.target.value }))}
              placeholder="Optional"
            />
          </SectionField>
          <SectionField label="Template">
            <Input
              value={resume.template}
              onChange={(event) => updateResume((current) => ({ ...current, template: event.target.value }))}
              placeholder="ats-default"
            />
          </SectionField>
        </div>
      </SectionCard>

      <SectionCard title="Personal Information" description="This appears in the top header of the resume.">
        <div className="grid gap-4 md:grid-cols-2">
          <SectionField label="Full Name">
            <Input value={resume.personalInfo.fullName} onChange={(event) => updatePersonal("fullName", event.target.value)} />
          </SectionField>
          <SectionField label="Email">
            <Input value={resume.personalInfo.email} onChange={(event) => updatePersonal("email", event.target.value)} />
          </SectionField>
          <SectionField label="Phone">
            <Input value={resume.personalInfo.phone} onChange={(event) => updatePersonal("phone", event.target.value)} />
          </SectionField>
          <SectionField label="Location">
            <Input value={resume.personalInfo.location} onChange={(event) => updatePersonal("location", event.target.value)} />
          </SectionField>
          <SectionField label="LinkedIn">
            <Input value={resume.personalInfo.linkedin} onChange={(event) => updatePersonal("linkedin", event.target.value)} />
          </SectionField>
          <SectionField label="GitHub">
            <Input value={resume.personalInfo.github} onChange={(event) => updatePersonal("github", event.target.value)} />
          </SectionField>
        </div>
      </SectionCard>

      <SectionCard title="Professional Summary">
        <SectionField label="Summary">
          <Textarea
            className="min-h-[140px]"
            value={resume.summary}
            onChange={(event) => updateResume((current) => ({ ...current, summary: event.target.value }))}
            placeholder="Write a concise role-focused summary."
          />
        </SectionField>
      </SectionCard>

      <SectionCard title="Experience" description="Add internships, freelance work, leadership roles, or part-time experience.">
        <div className="space-y-6">
          {resume.experience.map((experience, index) => (
            <div key={index} className="space-y-4 rounded-2xl border border-border/70 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <SectionField label="Company">
                  <Input
                    value={experience.company}
                    onChange={(event) =>
                      updateResume((current) => {
                        const updated = [...current.experience]
                        updated[index] = { ...updated[index], company: event.target.value }
                        return { ...current, experience: updated }
                      })
                    }
                  />
                </SectionField>
                <SectionField label="Role">
                  <Input
                    value={experience.role}
                    onChange={(event) =>
                      updateResume((current) => {
                        const updated = [...current.experience]
                        updated[index] = { ...updated[index], role: event.target.value }
                        return { ...current, experience: updated }
                      })
                    }
                  />
                </SectionField>
                <SectionField label="Duration">
                  <Input
                    value={experience.duration}
                    onChange={(event) =>
                      updateResume((current) => {
                        const updated = [...current.experience]
                        updated[index] = { ...updated[index], duration: event.target.value }
                        return { ...current, experience: updated }
                      })
                    }
                  />
                </SectionField>
                <SectionField label="Location">
                  <Input
                    value={experience.location}
                    onChange={(event) =>
                      updateResume((current) => {
                        const updated = [...current.experience]
                        updated[index] = { ...updated[index], location: event.target.value }
                        return { ...current, experience: updated }
                      })
                    }
                  />
                </SectionField>
              </div>
              <SectionField label="Impact Description">
                <Textarea
                  className="min-h-[120px]"
                  value={experience.description}
                  onChange={(event) =>
                    updateResume((current) => {
                      const updated = [...current.experience]
                      updated[index] = { ...updated[index], description: event.target.value }
                      return { ...current, experience: updated }
                    })
                  }
                  placeholder="Built a dashboard in React that reduced manual reporting time by 40%."
                />
              </SectionField>
              {resume.experience.length > 1 && (
                <Button
                  variant="ghost"
                  className="px-0 text-destructive hover:text-destructive"
                  onClick={() =>
                    updateResume((current) => ({
                      ...current,
                      experience: current.experience.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                >
                  Remove Experience
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              updateResume((current) => ({
                ...current,
                experience: [
                  ...current.experience,
                  { company: "", role: "", duration: "", location: "", description: "" },
                ],
              }))
            }
          >
            Add Experience
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Projects" description="Include scope, stack, and outcomes for each project.">
        <div className="space-y-6">
          {resume.projects.map((project, index) => (
            <div key={index} className="space-y-4 rounded-2xl border border-border/70 p-4">
              <SectionField label="Project Title">
                <Input
                  value={project.title}
                  onChange={(event) =>
                    updateResume((current) => {
                      const updated = [...current.projects]
                      updated[index] = { ...updated[index], title: event.target.value }
                      return { ...current, projects: updated }
                    })
                  }
                />
              </SectionField>
              <SectionField label="Description">
                <Textarea
                  className="min-h-[120px]"
                  value={project.description}
                  onChange={(event) =>
                    updateResume((current) => {
                      const updated = [...current.projects]
                      updated[index] = { ...updated[index], description: event.target.value }
                      return { ...current, projects: updated }
                    })
                  }
                />
              </SectionField>
              <SectionField label="Technologies">
                <Input
                  value={project.technologies}
                  onChange={(event) =>
                    updateResume((current) => {
                      const updated = [...current.projects]
                      updated[index] = { ...updated[index], technologies: event.target.value }
                      return { ...current, projects: updated }
                    })
                  }
                />
              </SectionField>
              {resume.projects.length > 1 && (
                <Button
                  variant="ghost"
                  className="px-0 text-destructive hover:text-destructive"
                  onClick={() =>
                    updateResume((current) => ({
                      ...current,
                      projects: current.projects.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                >
                  Remove Project
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              updateResume((current) => ({
                ...current,
                projects: [...current.projects, { title: "", description: "", technologies: "" }],
              }))
            }
          >
            Add Project
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Education">
        <div className="space-y-6">
          {resume.education.map((education, index) => (
            <div key={index} className="grid gap-4 rounded-2xl border border-border/70 p-4 md:grid-cols-2">
              <SectionField label="Institution">
                <Input
                  value={education.institution}
                  onChange={(event) =>
                    updateResume((current) => {
                      const updated = [...current.education]
                      updated[index] = { ...updated[index], institution: event.target.value }
                      return { ...current, education: updated }
                    })
                  }
                />
              </SectionField>
              <SectionField label="Degree">
                <Input
                  value={education.degree}
                  onChange={(event) =>
                    updateResume((current) => {
                      const updated = [...current.education]
                      updated[index] = { ...updated[index], degree: event.target.value }
                      return { ...current, education: updated }
                    })
                  }
                />
              </SectionField>
              <SectionField label="Year">
                <Input
                  value={education.year}
                  onChange={(event) =>
                    updateResume((current) => {
                      const updated = [...current.education]
                      updated[index] = { ...updated[index], year: event.target.value }
                      return { ...current, education: updated }
                    })
                  }
                />
              </SectionField>
              <SectionField label="Grade">
                <Input
                  value={education.grade}
                  onChange={(event) =>
                    updateResume((current) => {
                      const updated = [...current.education]
                      updated[index] = { ...updated[index], grade: event.target.value }
                      return { ...current, education: updated }
                    })
                  }
                />
              </SectionField>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              updateResume((current) => ({
                ...current,
                education: [...current.education, { institution: "", degree: "", year: "", grade: "" }],
              }))
            }
          >
            Add Education
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Skills" description="Use commas or new lines to keep the ATS parser happy.">
        <div className="grid gap-4 md:grid-cols-2">
          <SectionField label="Languages">
            <Textarea value={skillInputs.languages} onChange={(event) => updateSkills("languages", event.target.value)} />
          </SectionField>
          <SectionField label="Frameworks">
            <Textarea value={skillInputs.frameworks} onChange={(event) => updateSkills("frameworks", event.target.value)} />
          </SectionField>
          <SectionField label="Tools">
            <Textarea value={skillInputs.tools} onChange={(event) => updateSkills("tools", event.target.value)} />
          </SectionField>
          <SectionField label="Cloud">
            <Textarea value={skillInputs.cloud} onChange={(event) => updateSkills("cloud", event.target.value)} />
          </SectionField>
          <div className="md:col-span-2">
            <SectionField label="Concepts">
              <Textarea value={skillInputs.concepts} onChange={(event) => updateSkills("concepts", event.target.value)} />
            </SectionField>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Certifications" description="One item per line.">
          <Textarea
            className="min-h-[160px]"
            value={arrayToMultiline(resume.certifications)}
            onChange={(event) => updateListField("certifications", event.target.value)}
          />
        </SectionCard>
        <SectionCard title="Achievements" description="One item per line.">
          <Textarea
            className="min-h-[160px]"
            value={arrayToMultiline(resume.achievements)}
            onChange={(event) => updateListField("achievements", event.target.value)}
          />
        </SectionCard>
        <SectionCard title="Interests" description="One item per line.">
          <Textarea
            className="min-h-[160px]"
            value={arrayToMultiline(resume.interests)}
            onChange={(event) => updateListField("interests", event.target.value)}
          />
        </SectionCard>
        <SectionCard title="Strengths" description="One item per line.">
          <Textarea
            className="min-h-[160px]"
            value={arrayToMultiline(resume.strengths)}
            onChange={(event) => updateListField("strengths", event.target.value)}
          />
        </SectionCard>
      </div>
    </div>
  )
})