"use client"

import type { ReactNode } from "react"
import type { Resume } from "@/types/resume"
import {
  filterNonEmptyItems,
  getContactLine,
  getFilledEducation,
  getFilledProjects,
  getSkillGroups,
  hasPersonalInfo,
  isNonEmpty,
} from "@/lib/resume"

type AtsResumePreviewProps = {
  resume: Resume
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3 break-inside-avoid">
      <h2 className="border-b border-slate-300 pb-1 text-sm font-bold uppercase tracking-[0.18em] text-slate-800">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function AtsResumePreview({ resume }: AtsResumePreviewProps) {
  const contactLine = getContactLine(resume)
  const skillGroups = getSkillGroups(resume)
  const projects = getFilledProjects(resume)
  const educationEntries = getFilledEducation(resume)
  const certifications = filterNonEmptyItems(resume.certifications)
  const achievements = filterNonEmptyItems(resume.achievements)
  const interests = filterNonEmptyItems(resume.interests)
  const strengths = filterNonEmptyItems(resume.strengths)

  return (
    <article className="mx-auto w-full max-w-[210mm] bg-white text-[15px] leading-6 text-slate-950 shadow-sm print:max-w-none print:shadow-none">
      <div className="min-h-[297mm] space-y-6 px-8 py-10 print:min-h-0 print:px-10 print:py-8">
        {hasPersonalInfo(resume) && (
          <header className="space-y-2 text-center">
            {isNonEmpty(resume.personalInfo.fullName) && (
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                {resume.personalInfo.fullName}
              </h1>
            )}
            {contactLine && (
              <p className="text-sm text-slate-600">
                {contactLine}
              </p>
            )}
          </header>
        )}

        {isNonEmpty(resume.summary) && (
          <Section title="Professional Summary">
            <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
              {resume.summary.trim()}
            </p>
          </Section>
        )}

        {skillGroups.length > 0 && (
          <Section title="Technical Skills">
            <div className="space-y-2 text-sm text-slate-700">
              {skillGroups.map((group) => (
                <p key={group.label}>
                  <span className="font-semibold text-slate-900">{group.label}:</span>{" "}
                  {group.values.join(", ")}
                </p>
              ))}
            </div>
          </Section>
        )}

        {projects.length > 0 && (
          <Section title="Projects">
            <div className="space-y-4">
              {projects.map((project, index) => (
                <div key={`${project.title}-${index}`} className="space-y-1">
                  {isNonEmpty(project.title) && (
                    <h3 className="text-base font-semibold text-slate-900">{project.title.trim()}</h3>
                  )}
                  {isNonEmpty(project.description) && (
                    <p className="whitespace-pre-line text-sm text-slate-700">
                      {project.description.trim()}
                    </p>
                  )}
                  {isNonEmpty(project.technologies) && (
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Technologies:</span>{" "}
                      {project.technologies.trim()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {educationEntries.length > 0 && (
          <Section title="Education">
            <div className="space-y-4">
              {educationEntries.map((entry, index) => (
                <div key={`${entry.institution}-${index}`} className="space-y-1 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">
                    {[entry.degree, entry.institution].filter((value) => isNonEmpty(value)).join(", ")}
                  </p>
                  {[entry.year, entry.grade].some((value) => isNonEmpty(value)) && (
                    <p>{[entry.year, entry.grade].filter((value) => isNonEmpty(value)).join(" | ")}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {certifications.length > 0 && (
          <Section title="Certifications">
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {certifications.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>
        )}

        {achievements.length > 0 && (
          <Section title="Achievements">
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {achievements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>
        )}

        {interests.length > 0 && (
          <Section title="Interests">
            <p className="text-sm text-slate-700">{interests.join(", ")}</p>
          </Section>
        )}

        {strengths.length > 0 && (
          <Section title="Strengths">
            <p className="text-sm text-slate-700">{strengths.join(", ")}</p>
          </Section>
        )}
      </div>
    </article>
  )
}
