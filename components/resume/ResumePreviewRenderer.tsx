"use client"

import { AtsResumePreview } from "@/components/resume/AtsResumePreview"
import { DEFAULT_RESUME_TEMPLATE_ID, type ResumeTemplateId } from "@/lib/resume-templates"
import type { Resume } from "@/types/resume"

type ResumePreviewRendererProps = {
  resume: Resume
  templateId: ResumeTemplateId
}

export function ResumePreviewRenderer({
  resume,
  templateId,
}: ResumePreviewRendererProps) {
  switch (templateId) {
    case DEFAULT_RESUME_TEMPLATE_ID:
    default:
      return <AtsResumePreview resume={resume} />
  }
}
