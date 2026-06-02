import SiteHighlights from "@/components/SiteHighlights"
import ClanRankings from "@/components/ClanRankings"
import FeaturedClans from "@/components/FeaturedClans"
import PlayerRankings from "@/components/PlayerRankings"
import ActivityFeed from "@/components/ActivityFeed"
import CommunityOverview from "@/components/CommunityOverview"
import HomeSlider from "@/components/HomeSlider"

export default function Home() {
  return (
    <div>
      {/* Page banner — edge-to-edge at top of content area */}
      <div className="ch-page-banner">
        <img
          src="/images/home-banner.jpg"
          alt="Home banner"
          className="ch-page-banner-img"
        />
        <div className="ch-page-banner-content">
          <h1 className="ch-page-banner-title">Home</h1>
        </div>
      </div>
      <div className="ch-page-content p-4 lg:p-6 space-y-4">
      {/* Featured slider — floats between banner and content */}
      <HomeSlider />
      {/* Site feature highlights */}
      <SiteHighlights />

      {/* Row 1: Clan Rankings + Community */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          <ClanRankings />
        </div>
        <div className="flex flex-col">
          <CommunityOverview />
        </div>
      </div>

      {/* Row 2: Featured Clans + Today's Top Players */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          <FeaturedClans />
        </div>
        <div className="flex flex-col">
          <PlayerRankings />
        </div>
      </div>

      {/* Full-width activity feed */}
      <ActivityFeed />
      </div>
    </div>
  )
}
