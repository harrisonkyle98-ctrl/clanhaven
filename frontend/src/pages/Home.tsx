import SiteHighlights from "@/components/SiteHighlights"
import FeaturedClans from "@/components/FeaturedClans"
import ClanHavenNews from "@/components/ClanHavenNews"
import RecentClanActivity from "@/components/RecentClanActivity"
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

      {/* Row: Featured Clans + Clan Haven News */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          <ClanHavenNews />
        </div>
        <div className="flex flex-col">
          <FeaturedClans />
        </div>
      </div>

      {/* Full-width clan activity feed */}
      <RecentClanActivity />
      </div>
    </div>
  )
}
