import { NextResponse } from "next/server"

const MODEL = "llama3-70b-8192"

type StudyPlanRequestBody = {
  courseBreakdown: Array<{
    courseId: string
    label: string
    avgScore: number
    topicsCovered: number
    answersCount: number
  }>
  streak: number
  focusTopics: string[]
  dailyGoal: number
}

export async function POST(request: Request) {
  try {
    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 })
    }

    const body = (await request.json()) as StudyPlanRequestBody
    if (!Array.isArray(body.courseBreakdown) || body.courseBreakdown.length === 0) {
      return NextResponse.json({ error: "courseBreakdown is required" }, { status: 400 })
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content:
              "You are a placement preparation coach. Generate a concise 7-day study plan for a student. Keep it practical, specific, and readable. Format strictly as Day 1: ..., Day 2: ..., up to Day 7: ...",
          },
          {
            role: "user",
            content: `Based on this user's performance: ${JSON.stringify(body.courseBreakdown)}.
Current streak: ${body.streak}.
Daily goal: ${body.dailyGoal} questions per day.
Priority focus topics: ${body.focusTopics.join(", ") || "None identified yet"}.
Generate a 7-day study plan focusing on weak areas.
Format: Day 1: ..., Day 2: ..., etc.`,
          },
        ],
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: errorText || "Groq request failed" }, { status: response.status })
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const planText = data.choices?.[0]?.message?.content?.trim()

    if (!planText) {
      return NextResponse.json({ error: "Empty study plan response" }, { status: 502 })
    }

    return NextResponse.json({ planText, model: MODEL })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate study plan" },
      { status: 500 }
    )
  }
}
