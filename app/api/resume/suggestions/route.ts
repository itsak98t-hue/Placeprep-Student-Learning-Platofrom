import { NextResponse } from "next/server"

import { analyzeResume } from "@/lib/resume-analysis"
import type { Resume } from "@/types/resume"
import type { AiResumeSuggestionResponse } from "@/types/resume-analysis"

type SuggestionsRequestBody = {
  resume?: Resume
  jobDescription?: string
  targetRole?: string
}

function buildHeuristicResponse(
  resume: Resume,
  jobDescription: string,
  targetRole: string
): AiResumeSuggestionResponse {
  const analysis = analyzeResume(resume, jobDescription, targetRole)
  const sections = [
    { name: "Section Completeness", score: analysis.breakdown.sectionCompleteness, feedback: "Resume structure and essential sections coverage." },
    { name: "Keyword Match", score: analysis.breakdown.keywordMatch, feedback: "Role and JD keyword alignment." },
    { name: "Formatting Safety", score: analysis.breakdown.formattingSafety, feedback: "ATS-safe formatting and parsing friendliness." },
    { name: "Content Strength", score: analysis.breakdown.contentStrength, feedback: "Depth and specificity of achievements and responsibilities." },
    { name: "Quantified Impact", score: analysis.breakdown.quantifiedImpact, feedback: "Presence of measurable results and ownership." },
    { name: "Role Relevance", score: analysis.breakdown.roleRelevance, feedback: "Fit for the intended role." },
  ]

  return {
    source: "heuristic",
    summary:
      analysis.keywordCoverage > 0
        ? `Your resume is matching ${analysis.keywordCoverage}% of the strongest job-description keywords. Focus on closing the most relevant gaps while keeping claims truthful.`
        : "Your resume structure is ATS-safe. Add a target job description for more role-specific guidance.",
    suggestions: analysis.suggestions.map((suggestion) => ({
      title: "ATS Improvement",
      detail: suggestion,
      severity: "medium" as const,
    })),
    atsScore: analysis.overallScore,
    keywords: {
      found: analysis.matchedKeywords,
      missing: analysis.missingKeywords,
    },
    sections,
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SuggestionsRequestBody

    if (!body.resume) {
      return NextResponse.json({ error: "Resume payload is required." }, { status: 400 })
    }

    const jobDescription = body.jobDescription?.trim() || ""
    const targetRole = body.targetRole?.trim() || body.resume.targetRole || "Software Developer"
    const fallback = buildHeuristicResponse(body.resume, jobDescription, targetRole)
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(fallback)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-5",
        instructions:
          "You are an expert ATS resume reviewer. Return concise, practical suggestions grounded only in the provided resume and job description. Do not invent experience.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Resume JSON:\n${JSON.stringify(body.resume, null, 2)}\n\nTarget role:\n${targetRole}\n\nJob description:\n${jobDescription || "Not provided."}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "resume_ai_suggestions",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      title: { type: "string" },
                      detail: { type: "string" },
                      severity: {
                        type: "string",
                        enum: ["high", "medium", "low"],
                      },
                    },
                    required: ["title", "detail", "severity"],
                  },
                },
              },
              required: ["summary", "suggestions"],
            },
          },
        },
      }),
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json(fallback)
    }

    const data = (await response.json()) as { output_text?: string }
    const parsed = data.output_text
      ? (JSON.parse(data.output_text) as Pick<AiResumeSuggestionResponse, "summary" | "suggestions">)
      : null

    if (!parsed) {
      return NextResponse.json(fallback)
    }

    return NextResponse.json({
      atsScore: fallback.atsScore,
      keywords: fallback.keywords,
      sections: fallback.sections,
      ...parsed,
      source: "ai",
    } satisfies AiResumeSuggestionResponse)
  } catch (error) {
    console.error("Resume suggestions route error:", error)
    return NextResponse.json({ error: "Unable to generate suggestions right now." }, { status: 500 })
  }
}
