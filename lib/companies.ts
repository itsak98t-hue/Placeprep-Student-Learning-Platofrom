import { companyDetails } from "@/lib/company-details"
import type { CompanyTier } from "@/types/company"

export type Company = {
  name: string
  slug: string
  tier: CompanyTier
  roles: string[]
  openings: number
  salaryRange: string
  growth: number
}

export const companies: Company[] = companyDetails.map((company) => ({
  name: company.name,
  slug: company.slug,
  tier: company.tier,
  roles: company.roles,
  openings: company.openings,
  salaryRange: company.salaryRange,
  growth: company.growth,
}))
