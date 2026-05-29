import HeroSection from "@/components/HeroSection"
import ClanRankings from "@/components/ClanRankings"
import FeaturedClans from "@/components/FeaturedClans"
import PlayerRankings from "@/components/PlayerRankings"
import ActivityFeed from "@/components/ActivityFeed"
import CommunityOverview from "@/components/CommunityOverview"

export default function Home() {
  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1400px]">
      {/* Atmospheric identity header */}
      <HeroSection />

      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          <ClanRankings />
          <FeaturedClans />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <CommunityOverview />
          <PlayerRankings />
        </div>
      </div>

      {/* Full-width activity feed */}
      <ActivityFeed />
    </div>
  )
}
