export type LearningProgressStatus =
  | "Just Started"
  | "In Progress"
  | "Improving"
  | "Strong"
  | "Needs Work"

export type LearningModuleProgress = {
  moduleId: string
  moduleName: string
  completedTopics: number
  totalTopics: number
  completionPercent: number
  averageScore: number
  status: LearningProgressStatus
  updatedAt?: string
}

export type PerformanceTimelinePoint = {
  date: string
  score: number
  activityCount: number
}
