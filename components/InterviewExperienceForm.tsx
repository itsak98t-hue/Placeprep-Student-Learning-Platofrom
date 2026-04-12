"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

type Submission = {
  id: string
  companySlug: string
  role: string
  rounds: string
  questions: string
  difficulty: "Easy" | "Medium" | "Hard"
  result: "Selected" | "Rejected" | "Pending"
  createdAt: string
}

function readAll(): Submission[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("placeprep_interviews")
    return raw ? (JSON.parse(raw) as Submission[]) : []
  } catch {
    return []
  }
}

function writeAll(items: Submission[]) {
  localStorage.setItem("placeprep_interviews", JSON.stringify(items))
}

export default function InterviewExperienceForm({ companySlug }: { companySlug: string }) {
  const [role, setRole] = useState("")
  const [rounds, setRounds] = useState("")
  const [questions, setQuestions] = useState("")
  const [difficulty, setDifficulty] = useState<Submission["difficulty"]>("Medium")
  const [result, setResult] = useState<Submission["result"]>("Pending")
  const [justSaved, setJustSaved] = useState(false)

  const submissions = useMemo(() => {
    return readAll()
      .filter((s) => s.companySlug === companySlug)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [companySlug, justSaved])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const cleanedRole = role.trim()
    const cleanedRounds = rounds.trim()
    const cleanedQuestions = questions.trim()

    if (!cleanedRole || !cleanedRounds || !cleanedQuestions) return

    const newItem: Submission = {
      id: crypto.randomUUID(),
      companySlug,
      role: cleanedRole,
      rounds: cleanedRounds,
      questions: cleanedQuestions,
      difficulty,
      result,
      createdAt: new Date().toISOString(),
    }

    const all = readAll()
    all.unshift(newItem)
    writeAll(all)

    setRole("")
    setRounds("")
    setQuestions("")
    setDifficulty("Medium")
    setResult("Pending")

    setJustSaved((v) => !v)
  }

  function deleteSubmission(id: string) {
    const all = readAll().filter((s) => s.id !== id)
    writeAll(all)
    setJustSaved((v) => !v)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="rounded-xl border p-4 space-y-4">
        <div className="text-lg font-semibold">Submit Interview Experience</div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Role</div>
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g., Backend Intern / SDE-1" />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Rounds (what happened)</div>
          <Textarea
            value={rounds}
            onChange={(e) => setRounds(e.target.value)}
            placeholder={"Round 1: OA (2 DSA)\nRound 2: DSA + OOP\nRound 3: HR"}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Questions asked</div>
          <Textarea
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            placeholder="Mention key questions or topics asked..."
            rows={4}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-medium">Difficulty</div>
            <div className="flex gap-2">
              {(["Easy", "Medium", "Hard"] as const).map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant={difficulty === d ? "default" : "outline"}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Result</div>
            <div className="flex gap-2 flex-wrap">
              {(["Selected", "Rejected", "Pending"] as const).map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant={result === r ? "default" : "outline"}
                  onClick={() => setResult(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full">
          Save Experience (Local)
        </Button>

        <div className="text-xs text-muted-foreground">
          Stored locally in your browser (localStorage). Later we’ll connect backend moderation.
        </div>
      </form>

      <div className="space-y-3">
        <div className="text-lg font-semibold">Recent Submissions</div>

        {submissions.length === 0 ? (
          <div className="text-sm text-muted-foreground rounded-xl border p-4">
            No submissions yet. Be the first.
          </div>
        ) : (
          submissions.map((s) => (
            <div key={s.id} className="rounded-xl border p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold">{s.role}</div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">{s.difficulty}</Badge>
                    <Badge variant="outline">{s.result}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString()}
                  </div>
                </div>

                <Button variant="outline" onClick={() => deleteSubmission(s.id)}>
                  Delete
                </Button>
              </div>

              <div>
                <div className="text-sm font-medium">Rounds</div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">{s.rounds}</div>
              </div>

              <div>
                <div className="text-sm font-medium">Questions</div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">{s.questions}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}