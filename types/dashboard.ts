import type { Timestamp } from "firebase/firestore"

export type UserTier = "Tier 1" | "Tier 2" | "Tier 3"

export interface UserSettings {
  emailNotifications: boolean
  darkMode: boolean
  practiceReminders: boolean
  weeklyReport: boolean
}

export interface UserDoc {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  tier: UserTier
  streak: number
  lastActiveDate: string
  createdAt?: Timestamp
  achievements?: string[]
  settings?: Partial<UserSettings>
  interviewsCompleted?: number
  badges?: number
}

export interface AchievementDefinition {
  id: string
  title: string
  description: string
  progressLabel: (value: number) => string
}

export interface AchievementState extends AchievementDefinition {
  unlocked: boolean
  progressValue: number
  progressTarget: number
}

export interface StudyPlanDoc {
  weekId: string
  recommendedCourses: string[]
  dailyGoal: number
  focusTopics: string[]
  planText: string
  generatedAt?: Timestamp
}
