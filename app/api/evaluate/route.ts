import { NextRequest, NextResponse } from "next/server"

import { evaluateBehavioralWithGroq } from "@/lib/server/behavioral-evaluator"
import { analyzeGibberish } from "@/lib/server/gibberish"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function invalidResponse(message: string) {
  return NextResponse.json(
    {
      label: "weak",
      display_label: "weak",
      confidence: 0.95,
      class_probabilities: {
        weak: 0.95,
        average: 0.04,
        strong: 0.01,
      },
      score_clarity: 1,
      score_structure: 1,
      score_impact: 1,
      missing: [
        "specific situation",
        "actions you personally took",
        "clear result",
        "lesson learned",
      ],
      feedback: "Answer is not meaningful. Please provide a clear response.",
      suggested_improvement: "Start with the situation in one direct sentence, then explain your action and result.",
      interpretation: "This answer is too incomplete or unclear to evaluate properly yet.",
      is_invalid_answer: true,
      validation_message: message,
    },
    { status: 200 }
  )
}

export async function POST(request: NextRequest) {
  let body: { question?: string; answer?: string } | null = null

  try {
    body = (await request.json()) as { question?: string; answer?: string }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const question = body?.question?.trim() ?? ""
  const answer = body?.answer?.trim() ?? ""

  console.log("[evaluate] GROQ_API_KEY present:", !!process.env.GROQ_API_KEY)

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not configured" },
      { status: 500 }
    )
  }

  console.log("[/api/evaluate] input", {
    questionPreview: question.slice(0, 80),
    answerPreview: answer.slice(0, 120),
    answerLength: answer.length,
  })

  if (!question || !answer) {
    return NextResponse.json({ error: "Question and answer are required." }, { status: 400 })
  }

  const gibberish = analyzeGibberish(answer)

  if (gibberish.isGibberish) {
    console.log("[/api/evaluate] gibberish-rejected", gibberish)
    return invalidResponse(gibberish.reason ?? "Answer is not meaningful. Please provide a clear response.")
  }

  try {
    let evaluation

    try {
      evaluation = await evaluateBehavioralWithGroq(question, answer)
    } catch (error) {
      console.warn("[/api/evaluate] retrying after failure", error)
      evaluation = await evaluateBehavioralWithGroq(question, answer)
    }

    console.log("[/api/evaluate] output", {
      label: evaluation.label,
      clarity: evaluation.score_clarity,
      structure: evaluation.score_structure,
      impact: evaluation.score_impact,
    })

    return NextResponse.json(evaluation, { status: 200 })
  } catch (error) {
    console.error("[/api/evaluate] failed", error)
    return NextResponse.json(
      { error: "We couldn't evaluate this answer right now. Please try again." },
      { status: 502 }
    )
  }
}
