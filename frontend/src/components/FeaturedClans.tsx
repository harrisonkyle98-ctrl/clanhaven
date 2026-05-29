import { featuredClans } from "@/data/mockData"
import { Users, TrendingUp } from "lucide-react"
import CollapsiblePanel from "@/components/CollapsiblePanel"

export default function FeaturedClans() {
  return (
    <CollapsiblePanel variant="purple" title="Featured Clans">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {featuredClans.map((clan) => (
          <div
            key={clan.name}
            className="ch-stat-cell p-4 cursor-pointer group"
          >
            <div className="relative z-1">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-sm bg-gradient-to-br ${clan.bannerColor} flex items-center justify-center`}>
                    <span className="text-sm font-bold text-white/90">{clan.name[0]}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-highlight group-hover:text-gold transition-colors">
                      {clan.name}
                    </div>
                    <div className="text-[11px] text-text-muted">{clan.tagline}</div>
                  </div>
                </div>
                <span className={clan.gameType === "RS3" ? "badge-rs3" : "badge-osrs"}>
                  {clan.gameType}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1 text-text-muted">
                  <Users className="w-3 h-3" />
                  {clan.memberCount}
                </span>
                <span className="flex items-center gap-1 text-xp-green">
                  <TrendingUp className="w-3 h-3" />
                  +{clan.weeklyXp}/wk
                </span>
                <span className="text-text-muted ml-auto">Est. {clan.founded}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  )
}
