import codingCatalogJson from "@/placeprep-coding-ml/data/questions.json"
import type { PracticeQuestion } from "@/data/types"
import type { CodingQuestion, CodingDifficulty } from "@/types/coding"

type CodingCatalogEntry = {
  id: string
  title: string
  platform: string
  external_link: string
  topic: string
  subtopic: string
  difficulty: number
  pattern: string
  hint_levels?: string[]
  fallback_question_ids?: string[]
  upgrade_question_ids?: string[]
  similar_question_ids?: string[]
}

const codingCatalog = codingCatalogJson as CodingCatalogEntry[]

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ")
}

function toCodingQuestion(entry: CodingCatalogEntry): CodingQuestion {
  return {
    question_id: entry.id,
    title: entry.title,
    platform: entry.platform,
    topic: entry.topic,
    difficulty: entry.difficulty as CodingDifficulty,
    external_link: entry.external_link,
    subtopic: entry.subtopic,
    pattern: entry.pattern,
    hint_levels: entry.hint_levels ?? [],
    fallback_question_ids: entry.fallback_question_ids ?? [],
    upgrade_question_ids: entry.upgrade_question_ids ?? [],
    similar_question_ids: entry.similar_question_ids ?? [],
  }
}

export function enrichCodingQuestion(question: CodingQuestion | null): CodingQuestion | null {
  if (!question) {
    return null
  }

  const matched = codingCatalog.find((entry) => normalizeTitle(entry.title) === normalizeTitle(question.title))
  if (!matched) {
    return question
  }

  return {
    ...question,
    hint_levels: matched.hint_levels ?? [],
    fallback_question_ids: question.fallback_question_ids ?? matched.fallback_question_ids ?? [],
    upgrade_question_ids: question.upgrade_question_ids ?? matched.upgrade_question_ids ?? [],
    similar_question_ids: question.similar_question_ids ?? matched.similar_question_ids ?? [],
  }
}

export function findCodingQuestionByPracticeQuestion(question: PracticeQuestion): CodingQuestion | null {
  const matched = codingCatalog.find((entry) => normalizeTitle(entry.title) === normalizeTitle(question.title))
  return matched ? toCodingQuestion(matched) : null
}

export function findPracticeQuestionMatch(
  question: CodingQuestion | null,
  practiceQuestions: PracticeQuestion[]
): PracticeQuestion | null {
  if (!question) {
    return null
  }

  return (
    practiceQuestions.find(
      (practiceQuestion) => normalizeTitle(practiceQuestion.title) === normalizeTitle(question.title)
    ) ?? null
  )
}

export function isPracticeQuestionRecommended(
  practiceQuestion: PracticeQuestion,
  recommendedQuestion: CodingQuestion | null
): boolean {
  if (!recommendedQuestion) {
    return false
  }

  return normalizeTitle(practiceQuestion.title) === normalizeTitle(recommendedQuestion.title)
}
