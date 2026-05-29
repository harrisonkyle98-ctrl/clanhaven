import HeroSection from "@/components/HeroSection"
import ClanRankings from "@/components/ClanRankings"
import FeaturedClans from "@/components/FeaturedClans"
import PlayerRankings from "@/components/PlayerRankings"
import ActivityFeed from "@/components/ActivityFeed"
import CommunityOverview from "@/components/CommunityOverview"

export default function Home() {
  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Platform Overview</h1>
          <p className="text-xs text-muted-foreground">RuneScape community dashboard</p>
        </div>
        <div className="text-xs text-muted-foreground">
          Last updated: just now
        </div>
      </div>

      {/* Platform stats row */}
      <HeroSection />

      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column — 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <ClanRankings />
          <FeaturedClans />
        </div>

        {/* Right column — 1/3 width */}
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
