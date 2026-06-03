import { featuredClans } from "@/data/mockData"
import CollapsiblePanel from "@/components/CollapsiblePanel"

export default function FeaturedClans() {
  return (
    <CollapsiblePanel variant="blue" title="Featured Clans">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
        {featuredClans.map((clan) => (
          <div
            key={clan.name}
            className="ch-stat-cell p-4 cursor-pointer group flex flex-col h-full"
          >
            <div className="relative z-1 flex flex-col flex-1">
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
              <div className="flex items-center gap-4 text-[11px] mt-auto">
                <span className="flex items-center gap-1 text-text-muted">
                  {clan.memberCount}
                </span>
                <span className="flex items-center gap-1 text-xp-green">
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
