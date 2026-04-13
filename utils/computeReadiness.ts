import type { UserAnswer } from "@/types/answers"

export function computeReadiness(requiredCourseIds: string[], answers: UserAnswer[]): number {
  if (requiredCourseIds.length === 0) {
    return 0
  }

  const scores = requiredCourseIds.map((courseId) => {
    const courseAnswers = answers.filter((answer) => answer.courseId === courseId)
    if (courseAnswers.length === 0) {
      return 0
    }

    const correctCount = courseAnswers.filter((answer) => answer.isCorrect === true).length
    return (correctCount / courseAnswers.length) * 100
  })

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

