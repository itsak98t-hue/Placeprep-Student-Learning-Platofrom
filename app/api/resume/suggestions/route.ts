import { NextResponse } from "next/server"

import { analyzeResume } from "@/lib/resume-analysis"
import type { Resume } from "@/types/resume"
import type { AiResumeSuggestionResponse } from "@/types/resume-analysis"

type SuggestionsRequestBody = {
  resume?: Resume
  jobDescription?: string
}

function buildHeuristicResponse(resume: Resume, jobDescription: string): AiResumeSuggestionResponse {
  const analysis = analyzeResume(resume, jobDescription)

  return {
    source: "heuristic",
    summary:
      analysis.keywordCoverage > 0
        ? `Your resume is matching ${analysis.keywordCoverage}% of the strongest job-description keywords. Focus on closing the most relevant gaps while keeping claims truthful.`
        : "Your resume structure is ATS-safe. Add a target job description for more role-specific guidance.",
    suggestions: analysis.suggestions,
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SuggestionsRequestBody

    if (!body.resume) {
      return NextResponse.json({ error: "Resume payload is required." }, { status: 400 })
    }

    const jobDescription = body.jobDescription?.trim() || ""
    const fallback = buildHeuristicResponse(body.resume, jobDescription)
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(fallback)
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
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
                text: `Resume JSON:\n${JSON.stringify(body.resume, null, 2)}\n\nJob description:\n${jobDescription || "Not provided."}`,
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

    if (!response.ok) {
      return NextResponse.json(fallback)
    }

    const data = (await response.json()) as { output_text?: string }
    const parsed = data.output_text ? (JSON.parse(data.output_text) as Omit<AiResumeSuggestionResponse, "source">) : null

    if (!parsed) {
      return NextResponse.json(fallback)
    }

    return NextResponse.json({
      ...parsed,
      source: "ai",
    } satisfies AiResumeSuggestionResponse)
  } catch (error) {
    console.error("Resume suggestions route error:", error)
    return NextResponse.json({ error: "Unable to generate suggestions right now." }, { status: 500 })
  }
}
