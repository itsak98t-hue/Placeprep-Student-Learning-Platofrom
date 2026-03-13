import { notFound } from "next/navigation"

import { PracticeQuestionDetail } from "@/components/practice/PracticeQuestionDetail"
import { practiceQuestions, practiceQuestionsById } from "@/data/questions"

export function generateStaticParams() {
  return practiceQuestions.map((question) => ({ id: question.id }))
}

export default function PracticeDetailPage({ params }: { params: { id: string } }) {
  const question = practiceQuestionsById[params.id]

  if (!question) {
    return notFound()
  }

  return <PracticeQuestionDetail question={question} />
}
