export type Company = {
  name: string
  slug: string
  tier: 1 | 2 | 3
  roles: string[]
  openings: number
  salaryRange: string
  growth: number // percent like 15 means +15%
}

export const companies: Company[] = [
  {
    name: "Google",
    slug: "google",
    tier: 1,
    roles: ["Software Engineer", "Product Manager", "Data Scientist"],
    openings: 12,
    salaryRange: "$150-180K",
    growth: 15,
  },
  {
    name: "Microsoft",
    slug: "microsoft",
    tier: 1,
    roles: ["Software Engineer", "Cloud Solutions Architect"],
    openings: 8,
    salaryRange: "$140-170K",
    growth: 12,
  },
  {
    name: "Amazon",
    slug: "amazon",
    tier: 1,
    roles: ["SDE", "Technical Program Manager", "UX Designer"],
    openings: 15,
    salaryRange: "$135-165K",
    growth: 18,
  },
]