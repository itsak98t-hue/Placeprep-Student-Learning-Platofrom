"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { BehavioralDisplayLabel, BehavioralPredictResponse } from "@/types/behavioral"

type BehavioralEvaluationCardProps = {
  result: BehavioralPredictResponse
}

function formatDisplayLabel(label: BehavioralDisplayLabel | string): string {
  return label
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getBadgeClassName(label: BehavioralDisplayLabel): string {
  switch (label) {
    case "strong":
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
    case "almost_strong":
      return "border-emerald-400/30 bg-emerald-400/15 text-emerald-100"
    case "borderline_strong":
      return "border-lime-400/30 bg-lime-400/15 text-lime-100"
    case "borderline_average":
      return "border-amber-500/30 bg-amber-500/15 text-amber-100"
    case "average":
      return "border-yellow-500/30 bg-yellow-500/15 text-yellow-100"
    default:
      return "border-rose-500/30 bg-rose-500/15 text-rose-100"
  }
}

function getBarClassName(value: number): string {
  if (value >= 8) {
    return "bg-emerald-400"
  }
  if (value >= 6) {
    return "bg-yellow-400"
  }
  if (value >= 4) {
    return "bg-amber-400"
  }
  return "bg-rose-400"
}

function ScoreBar({
  label,
  value,
  isVisible,
  delayMs = 0,
}: {
  label: string
  value: number
  isVisible: boolean
  delayMs?: number
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-medium text-white">{value}/10</span>
      </div>
      <div className="h-2.5 rounded-full bg-[#0a1329]">
        <div
          className={`h-2.5 rounded-full transition-[width] duration-700 ease-out ${getBarClassName(value)}`}
          style={{
            width: isVisible ? `${Math.max(0, Math.min(100, value * 10))}%` : "0%",
            transitionDelay: `${delayMs}ms`,
          }}
        />
      </div>
    </div>
  )
}

function ProbabilityRow({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-[#0a1329] px-4 py-3 text-sm">
      <span className="capitalize text-slate-300">{label}</span>
      <span className="font-medium text-white">{Math.round(value * 100)}%</span>
    </div>
  )
}

export function BehavioralEvaluationCard({ result }: BehavioralEvaluationCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const displayLabel = result.display_label ?? result.label ?? "average"
  const confidence = typeof result.confidence === "number" ? result.confidence : 0
  const interpretation = result.interpretation?.trim() || ""
  const feedback = result.feedback?.trim() || ""
  const suggestedImprovement = result.suggested_improvement?.trim() || ""
  const missingPoints = Array.isArray(result.missing)
    ? result.missing.filter((item) => typeof item === "string" && item.trim().length > 0)
    : []
  const classProbabilities = {
    weak: typeof result.class_probabilities?.weak === "number" ? result.class_probabilities.weak : 0,
    average: typeof result.class_probabilities?.average === "number" ? result.class_probabilities.average : 0,
    strong: typeof result.class_probabilities?.strong === "number" ? result.class_probabilities.strong : 0,
  }
  const hasProbabilityData = Object.values(classProbabilities).some((value) => value > 0)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true)
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <Card
      className={`rounded-[28px] border border-slate-800 bg-[#0c1733] shadow-sm transition-all duration-300 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <CardContent className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 ${
                  isVisible ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"
                } ${getBadgeClassName(displayLabel as BehavioralDisplayLabel)}`}
              >
                {formatDisplayLabel(displayLabel)}
              </Badge>
              <div className="rounded-full border border-slate-800 bg-[#0a1329] px-3 py-1 text-xs text-slate-300 transition-colors duration-200">
                Confidence {Math.round(confidence * 100)}%
              </div>
            </div>
            {interpretation && (
              <p
                className={`text-sm text-slate-300 transition-all duration-300 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                }`}
                style={{ transitionDelay: "60ms" }}
              >
                {interpretation}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-[#0a1329] p-4 transition-all duration-300" style={{ transitionDelay: "80ms" }}>
            <ScoreBar label="Clarity" value={result.score_clarity} isVisible={isVisible} delayMs={80} />
          </div>
          <div className="rounded-2xl border border-slate-800 bg-[#0a1329] p-4 transition-all duration-300" style={{ transitionDelay: "130ms" }}>
            <ScoreBar label="Structure" value={result.score_structure} isVisible={isVisible} delayMs={130} />
          </div>
          <div className="rounded-2xl border border-slate-800 bg-[#0a1329] p-4 transition-all duration-300" style={{ transitionDelay: "180ms" }}>
            <ScoreBar label="Impact" value={result.score_impact} isVisible={isVisible} delayMs={180} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {feedback && (
            <div
              className={`rounded-2xl border border-slate-800 bg-[#0a1329] p-4 transition-all duration-300 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
              }`}
              style={{ transitionDelay: "120ms" }}
            >
              <h3 className="text-sm font-semibold text-white">Feedback</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{feedback}</p>
            </div>
          )}

          {suggestedImprovement && (
            <div
              className={`rounded-2xl border border-slate-800 bg-[#0a1329] p-4 transition-all duration-300 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
              }`}
              style={{ transitionDelay: "170ms" }}
            >
              <h3 className="text-sm font-semibold text-white">Suggested Improvement</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{suggestedImprovement}</p>
            </div>
          )}
        </div>

        {(missingPoints.length > 0 || hasProbabilityData) && (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            {missingPoints.length > 0 && (
              <div
                className={`rounded-2xl border border-slate-800 bg-[#0a1329] p-4 transition-all duration-300 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                }`}
                style={{ transitionDelay: "220ms" }}
              >
                <h3 className="text-sm font-semibold text-white">Missing Points</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                  {missingPoints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {hasProbabilityData && (
              <div
                className={`rounded-2xl border border-slate-800 bg-[#0a1329] p-4 transition-all duration-300 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                }`}
                style={{ transitionDelay: "260ms" }}
              >
                <h3 className="text-sm font-semibold text-white">Probability Breakdown</h3>
                <div className="mt-3 space-y-3">
                  <ProbabilityRow label="weak" value={classProbabilities.weak} />
                  <ProbabilityRow label="average" value={classProbabilities.average} />
                  <ProbabilityRow label="strong" value={classProbabilities.strong} />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
