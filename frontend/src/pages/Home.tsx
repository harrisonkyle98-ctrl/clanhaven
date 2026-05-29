import HeroSection from "@/components/HeroSection"
import ClanRankings from "@/components/ClanRankings"
import FeaturedClans from "@/components/FeaturedClans"
import PlayerRankings from "@/components/PlayerRankings"
import ActivityFeed from "@/components/ActivityFeed"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <div>
      <HeroSection />
      <ClanRankings />
      <FeaturedClans />
      <PlayerRankings />
      <ActivityFeed />
      <Footer />
    </div>
  )
}
