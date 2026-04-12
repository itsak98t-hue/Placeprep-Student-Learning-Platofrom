const ACTION_VERBS = [
  "built",
  "developed",
  "designed",
  "implemented",
  "optimized",
  "created",
  "launched",
  "engineered",
  "improved",
  "automated",
  "integrated",
  "delivered",
  "led",
  "reduced",
  "increased",
  "analyzed",
]

const TECHNICAL_TERMS = [
  "react",
  "next.js",
  "typescript",
  "javascript",
  "firebase",
  "node",
  "python",
  "sql",
  "api",
  "aws",
  "tailwind",
  "docker",
  "mongodb",
  "postgresql",
]

export function splitBullets(text: string): string[] {
  return text
    .split(/\n|•|-/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function evaluateBulletStrength(bullets: string[]) {
  const weakBullets: string[] = []
  let strongBulletCount = 0
  let quantifiedBulletCount = 0

  for (const bullet of bullets) {
    const normalizedBullet = bullet.toLowerCase()
    const hasActionVerb = ACTION_VERBS.some((verb) => normalizedBullet.includes(verb))
    const hasTechnicalSpecificity = TECHNICAL_TERMS.some((term) => normalizedBullet.includes(term))
    const hasMetric = /\d/.test(normalizedBullet)
    const hasSufficientLength = bullet.trim().split(/\s+/).length >= 7

    if (hasMetric) {
      quantifiedBulletCount += 1
    }

    if (hasActionVerb && hasTechnicalSpecificity && hasSufficientLength) {
      strongBulletCount += 1
      continue
    }

    if (!hasActionVerb || !hasTechnicalSpecificity || !hasSufficientLength) {
      weakBullets.push(bullet)
    }
  }

  return {
    weakBullets,
    strongBulletCount,
    quantifiedBulletCount,
  }
}
