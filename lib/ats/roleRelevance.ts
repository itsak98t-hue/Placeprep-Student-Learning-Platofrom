const ROLE_KEYWORDS: Record<string, string[]> = {
  "software developer": ["api", "backend", "frontend", "typescript", "react", "node", "database"],
  "frontend developer": ["react", "next.js", "tailwind", "typescript", "ui", "responsive", "css"],
  "backend developer": ["api", "node", "express", "database", "sql", "authentication", "server"],
  "data analyst": ["sql", "python", "excel", "dashboard", "analysis", "visualization", "power bi"],
}

export function getRoleKeywords(targetRole: string): string[] {
  const normalizedRole = targetRole.trim().toLowerCase()
  return ROLE_KEYWORDS[normalizedRole] ?? ROLE_KEYWORDS["software developer"]
}

export function scoreRoleRelevance(resumeText: string, targetRole: string): number {
  const keywords = getRoleKeywords(targetRole)
  const matchCount = keywords.filter((keyword) => resumeText.includes(keyword)).length
  return Math.round((matchCount / keywords.length) * 10)
}
