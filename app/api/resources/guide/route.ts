import { NextResponse } from "next/server"
import { fetchGroqWithTimeout } from "@/lib/server/groq"

const MODEL = "llama3-70b-8192"

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      )
    }

    const body = (await request.json()) as { courseLabel?: string; topicId?: string; model?: string }
    if (!body.courseLabel || !body.topicId) {
      return NextResponse.json(
        { error: "courseLabel and topicId are required" },
        { status: 400 }
      )
    }

    const data = (await fetchGroqWithTimeout({
        model: body.model || MODEL,
        messages: [
          {
            role: "system",
            content:
              `You are a campus placement expert. Generate structured, exam-focused study guides.
Always respond in this exact markdown structure:
## Key Concepts
(3-5 bullet points of core theory)

## Common Interview Questions
(3-4 actual questions asked in placements)

## Quick Tips
(2-3 actionable tips)

## Example
(one concrete code/scenario example)`,
          },
          {
            role: "user",
            content: `Generate a placement preparation guide for topic: "${body.topicId}" in course: "${body.courseLabel}".`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }, 25000)) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const feedback = data.choices?.[0]?.message?.content?.trim()
    if (!feedback) {
      return NextResponse.json(
        { error: "Empty guide response" },
        { status: 502 }
      )
    }

    return NextResponse.json({
      feedback,
      model: body.model || MODEL,
    })
  } catch (error) {
    console.error("[/api/resources/guide] Groq error:", error)
    return NextResponse.json(
      { error: "Guide generation failed", details: String(error) },
      { status: 500 }
    )
  }
}
