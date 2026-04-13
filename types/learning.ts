export type CourseStatus = "not-started" | "in-progress" | "improving" | "completed"

export type CourseConfig = {
  id: string
  label: string
  totalTopics: number
  icon: string
  topics?: string[]
}

export type UserProgressRecord = {
  courseId: string
  topicsCompleted: string[]
  totalTopics: number
  scores: number[]
  lastUpdated?: string | null
  status?: CourseStatus
}

export type UserSessionRecord = {
  id: string
  courseId: string
  topicId: string
  score: number
  correctAnswers: number
  totalQuestions: number
  timeTakenSeconds: number
  completedAt: string
  aiFeedback: string
  aiFeedbackStoredAt?: string | null
}

export type LeaderboardEntry = {
  uid: string
  displayName: string
  tier: string
  avgScore: number
  streak: number
  photoURL?: string | null
  problemsSolved?: number
  rankScore?: number
  totalScore?: number
  avgAccuracy?: number
  topicsCovered?: number
  lastUpdated?: string | null
}

export type FirestoreCompany = {
  id: string
  name: string
  logo: string
  requiredCourses: string[]
  focusAreas: string[]
  difficulty: "easy" | "medium" | "hard"
  avgPackageLPA: number
  openRoles: string[]
  tips: string
}

export type AnalyticsOverview = {
  avgScore: number
  accuracy: number
  streak: number
  topicsCovered: number
  totalSessions: number
  averageScoreTrend: Array<{ date: string; score: number; activityCount: number }>
  courseBreakdown: Record<string, UserProgressRecord>
  recentSessions: UserSessionRecord[]
}
