import HeroSection from "@/components/HeroSection"
import FeatureSection from "@/components/FeatureSection"
import TrendingCompanies from "@/components/TrendingCompanies"
import ActivityCalendar from "@/components/ActivityCalendar"
import PopularResourcesSection from "@/components/PopularResourcesSection"
import StudyPlanSection from "@/components/StudyPlanSection"

export default function Home() {
  return (
    <div>
      <HeroSection />

      <FeatureSection />

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <TrendingCompanies />
            </div>
            <div>
              <ActivityCalendar />
            </div>
          </div>
        </div>
      </section>

      <StudyPlanSection />
      <PopularResourcesSection />
    </div>
  )
}
