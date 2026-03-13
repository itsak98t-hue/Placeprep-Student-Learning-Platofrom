import { notFound } from "next/navigation"

import { BehavioralQuestionDetail } from "@/components/behavioral/BehavioralQuestionDetail"
import { behavioralQuestions, behavioralQuestionsById } from "@/data/behavioral"
import { PracticeQuestionDetail } from "@/components/practice/PracticeQuestionDetail"
import { practiceQuestions, practiceQuestionsById } from "@/data/questions"

export function generateStaticParams() {
  return [...practiceQuestions, ...behavioralQuestions].map((question) => ({ id: question.id }))
}

export default function PracticeDetailPage({ params }: { params: { id: string } }) {
  const technicalQuestion = practiceQuestionsById[params.id]
  const behavioralQuestion = behavioralQuestionsById[params.id]

  if (!technicalQuestion && !behavioralQuestion) {
    return notFound()
  }

  if (technicalQuestion) {
    return <PracticeQuestionDetail question={technicalQuestion} />
  }

  return <BehavioralQuestionDetail question={behavioralQuestion} />
}
