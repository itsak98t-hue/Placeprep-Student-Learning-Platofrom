"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"

import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { db } from "@/lib/firebase"
import { arrayToMultiline, emptyResume, normalizeResume, stringToArray } from "@/lib/resume"
import type { Resume } from "@/types/resume"

function createSkillDrafts(resume: Resume) {
  return {
    languages: arrayToMultiline(resume.technicalSkills.languages),
    frameworks: arrayToMultiline(resume.technicalSkills.frameworks),
    tools: arrayToMultiline(resume.technicalSkills.tools),
    cloud: arrayToMultiline(resume.technicalSkills.cloud),
    concepts: arrayToMultiline(resume.technicalSkills.concepts),
  }
}

function createListDrafts(resume: Resume) {
  return {
    certifications: arrayToMultiline(resume.certifications),
    achievements: arrayToMultiline(resume.achievements),
    interests: arrayToMultiline(resume.interests),
    strengths: arrayToMultiline(resume.strengths),
  }
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

export default function ResumePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [resume, setResume] = useState<Resume>(emptyResume)
  const [skillDrafts, setSkillDrafts] = useState(() => createSkillDrafts(emptyResume))
  const [listDrafts, setListDrafts] = useState(() => createListDrafts(emptyResume))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      setLoading(false)
      return
    }

    const loadResume = async () => {
      try {
        const ref = doc(db, "resumes", user.uid)
        const snap = await getDoc(ref)

        if (snap.exists()) {
          const data = snap.data()
          const normalizedResume = normalizeResume(data.resume)
          setResume(normalizedResume)
          setSkillDrafts(createSkillDrafts(normalizedResume))
          setListDrafts(createListDrafts(normalizedResume))
        } else {
          setResume(emptyResume)
          setSkillDrafts(createSkillDrafts(emptyResume))
          setListDrafts(createListDrafts(emptyResume))
        }
      } catch (error) {
        console.error("Resume load error:", error)
        setStatusMessage("We couldn't load your saved resume. You can still continue editing.")
      } finally {
        setLoading(false)
      }
    }

    void loadResume()
  }, [authLoading, user])

  const persistResume = async () => {
    if (!user) {
      return false
    }

    try {
      setSaving(true)
      setStatusMessage("")

      const ref = doc(db, "resumes", user.uid)
      await setDoc(
        ref,
        {
          userId: user.uid,
          email: user.email || "",
          resume,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      setStatusMessage("Resume saved successfully.")
      return true
    } catch (error) {
      console.error("Resume save error:", error)
      setStatusMessage("Save failed. Please try again.")
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePreview = async () => {
    const didSave = await persistResume()

    if (didSave) {
      router.push("/dashboard/resume/preview")
    }
  }

  const updatePersonal = (field: keyof Resume["personalInfo"], value: string) => {
    setResume((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }))
  }

  const updateSummary = (value: string) => {
    setResume((prev) => ({ ...prev, summary: value }))
  }

  const updateEducation = (
    index: number,
    field: keyof Resume["education"][number],
    value: string
  ) => {
    setResume((prev) => {
      const updated = [...prev.education]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, education: updated }
    })
  }

  const addEducation = () => {
    setResume((prev) => ({
      ...prev,
      education: [...prev.education, { institution: "", degree: "", year: "", grade: "" }],
    }))
  }

  const updateProject = (
    index: number,
    field: keyof Resume["projects"][number],
    value: string
  ) => {
    setResume((prev) => {
      const updated = [...prev.projects]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, projects: updated }
    })
  }

  const addProject = () => {
    setResume((prev) => ({
      ...prev,
      projects: [...prev.projects, { title: "", description: "", technologies: "" }],
    }))
  }

  const updateSkills = (field: keyof Resume["technicalSkills"], value: string) => {
    setSkillDrafts((prev) => ({
      ...prev,
      [field]: value,
    }))

    setResume((prev) => ({
      ...prev,
      technicalSkills: {
        ...prev.technicalSkills,
        [field]: stringToArray(value),
      },
    }))
  }

  const updateListField = (
    field: "certifications" | "achievements" | "interests" | "strengths",
    value: string
  ) => {
    setListDrafts((prev) => ({
      ...prev,
      [field]: value,
    }))

    setResume((prev) => ({
      ...prev,
      [field]: stringToArray(value),
    }))
  }

  if (loading || authLoading) {
    return <p className="p-8 text-sm text-muted-foreground">Loading resume builder...</p>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Resume Builder</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Build your resume here, then generate an ATS-friendly single-column preview that is ready
            for print and PDF export.
          </p>
          {statusMessage && <p className="text-sm text-muted-foreground">{statusMessage}</p>}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={persistResume} disabled={saving}>
            {saving ? "Saving..." : "Save Resume"}
          </Button>
          <Button onClick={handleGeneratePreview} disabled={saving}>
            {saving ? "Preparing..." : "Generate ATS Resume"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>This information appears in the top header of the ATS resume.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <SectionField label="Full Name">
            <Input
              placeholder="Full Name"
              value={resume.personalInfo.fullName}
              onChange={(e) => updatePersonal("fullName", e.target.value)}
            />
          </SectionField>

          <SectionField label="Email">
            <Input
              placeholder="Email"
              value={resume.personalInfo.email}
              onChange={(e) => updatePersonal("email", e.target.value)}
            />
          </SectionField>

          <SectionField label="Phone">
            <Input
              placeholder="Phone"
              value={resume.personalInfo.phone}
              onChange={(e) => updatePersonal("phone", e.target.value)}
            />
          </SectionField>

          <SectionField label="Location">
            <Input
              placeholder="Location"
              value={resume.personalInfo.location}
              onChange={(e) => updatePersonal("location", e.target.value)}
            />
          </SectionField>

          <SectionField label="LinkedIn">
            <Input
              placeholder="LinkedIn URL"
              value={resume.personalInfo.linkedin}
              onChange={(e) => updatePersonal("linkedin", e.target.value)}
            />
          </SectionField>

          <SectionField label="GitHub">
            <Input
              placeholder="GitHub URL"
              value={resume.personalInfo.github}
              onChange={(e) => updatePersonal("github", e.target.value)}
            />
          </SectionField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Professional Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <SectionField label="Summary">
            <Textarea
              value={resume.summary}
              onChange={(e) => updateSummary(e.target.value)}
              className="min-h-[140px]"
              placeholder="Write a concise overview of your background, strengths, and target role."
            />
          </SectionField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical Skills</CardTitle>
          <CardDescription>Use commas or new lines. The preview converts these into grouped text lists.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <SectionField label="Languages">
            <Textarea
              placeholder={"C++\nJava\nPython"}
              value={skillDrafts.languages}
              onChange={(e) => updateSkills("languages", e.target.value)}
            />
          </SectionField>

          <SectionField label="Frameworks">
            <Textarea
              placeholder={"React\nNext.js\nNode.js"}
              value={skillDrafts.frameworks}
              onChange={(e) => updateSkills("frameworks", e.target.value)}
            />
          </SectionField>

          <SectionField label="Tools">
            <Textarea
              placeholder={"Git\nGitHub\nVS Code"}
              value={skillDrafts.tools}
              onChange={(e) => updateSkills("tools", e.target.value)}
            />
          </SectionField>

          <SectionField label="Cloud">
            <Textarea
              placeholder={"Firebase\nAWS"}
              value={skillDrafts.cloud}
              onChange={(e) => updateSkills("cloud", e.target.value)}
            />
          </SectionField>

          <div className="md:col-span-2">
            <SectionField label="Concepts">
              <Textarea
                placeholder={"Data Structures\nOOP\nDBMS"}
                value={skillDrafts.concepts}
                onChange={(e) => updateSkills("concepts", e.target.value)}
              />
            </SectionField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Include clear project titles, impact-focused descriptions, and technologies used.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {resume.projects.map((project, index) => (
            <div key={index} className="space-y-3 rounded-2xl border p-4">
              <SectionField label={`Project ${index + 1} Title`}>
                <Input
                  placeholder="Project Title"
                  value={project.title}
                  onChange={(e) => updateProject(index, "title", e.target.value)}
                />
              </SectionField>

              <SectionField label="Description">
                <Textarea
                  placeholder="Describe the problem, what you built, and the result."
                  value={project.description}
                  onChange={(e) => updateProject(index, "description", e.target.value)}
                  className="min-h-[120px]"
                />
              </SectionField>

              <SectionField label="Technologies">
                <Input
                  placeholder="Next.js, Firebase, Tailwind CSS"
                  value={project.technologies}
                  onChange={(e) => updateProject(index, "technologies", e.target.value)}
                />
              </SectionField>
            </div>
          ))}

          <Button variant="outline" onClick={addProject}>
            Add Project
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Education</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {resume.education.map((education, index) => (
            <div key={index} className="grid gap-4 rounded-2xl border p-4 md:grid-cols-2">
              <SectionField label="Institution">
                <Input
                  placeholder="Institution"
                  value={education.institution}
                  onChange={(e) => updateEducation(index, "institution", e.target.value)}
                />
              </SectionField>

              <SectionField label="Degree">
                <Input
                  placeholder="Degree"
                  value={education.degree}
                  onChange={(e) => updateEducation(index, "degree", e.target.value)}
                />
              </SectionField>

              <SectionField label="Year">
                <Input
                  placeholder="2026"
                  value={education.year}
                  onChange={(e) => updateEducation(index, "year", e.target.value)}
                />
              </SectionField>

              <SectionField label="Grade">
                <Input
                  placeholder="CGPA / Percentage"
                  value={education.grade}
                  onChange={(e) => updateEducation(index, "grade", e.target.value)}
                />
              </SectionField>
            </div>
          ))}

          <Button variant="outline" onClick={addEducation}>
            Add Education
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Certifications</CardTitle>
            <CardDescription>One certification per line.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[160px]"
              placeholder={"AWS Cloud Practitioner\nGoogle Data Analytics"}
              value={listDrafts.certifications}
              onChange={(e) => updateListField("certifications", e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>One achievement per line.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[160px]"
              placeholder={"Solved 300+ DSA problems\nTop 5 in department hackathon"}
              value={listDrafts.achievements}
              onChange={(e) => updateListField("achievements", e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interests</CardTitle>
            <CardDescription>One interest per line.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[160px]"
              placeholder={"Open source\nTech communities\nReading"}
              value={listDrafts.interests}
              onChange={(e) => updateListField("interests", e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Strengths</CardTitle>
            <CardDescription>One strength per line.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[160px]"
              placeholder={"Problem solving\nOwnership\nClear communication"}
              value={listDrafts.strengths}
              onChange={(e) => updateListField("strengths", e.target.value)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
