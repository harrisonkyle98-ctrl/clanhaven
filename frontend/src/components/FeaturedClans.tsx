import { featuredClans } from "@/data/mockData"
import { Users, TrendingUp } from "lucide-react"

export default function FeaturedClans() {
  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">Featured Clans</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border">
        {featuredClans.map((clan) => (
          <div
            key={clan.name}
            className="bg-panel p-4 hover:bg-secondary/20 transition-colors group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded bg-gradient-to-br ${clan.bannerColor} flex items-center justify-center`}>
                  <span className="text-sm font-bold text-white/90">{clan.name[0]}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors">
                    {clan.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{clan.tagline}</div>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                clan.gameType === "RS3"
                  ? "bg-rs3/15 text-rs3"
                  : "bg-osrs/15 text-osrs"
              }`}>
                {clan.gameType}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-3 h-3" />
                {clan.memberCount}
              </span>
              <span className="flex items-center gap-1 text-xp-green">
                <TrendingUp className="w-3 h-3" />
                +{clan.weeklyXp}/wk
              </span>
              <span className="text-muted-foreground ml-auto">Est. {clan.founded}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
