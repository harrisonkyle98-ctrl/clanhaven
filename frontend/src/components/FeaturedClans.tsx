import { featuredClans } from "@/data/mockData"
import { Users, TrendingUp } from "lucide-react"

export default function FeaturedClans() {
  return (
    <div className="ch-panel overflow-hidden">
      <div className="ch-panel-header">Featured Clans</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 relative z-1">
        {featuredClans.map((clan, i) => (
          <div
            key={clan.name}
            className={`p-4 hover:bg-white/[0.02] transition-colors group cursor-pointer relative ${
              i % 2 === 0 ? "sm:border-r border-border/60" : ""
            } ${i < 2 ? "border-b border-border/60" : ""}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-sm bg-gradient-to-br ${clan.bannerColor} flex items-center justify-center border border-white/10`}>
                  <span className="text-sm font-bold text-white/90">{clan.name[0]}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground group-hover:text-gold transition-colors">
                    {clan.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{clan.tagline}</div>
                </div>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border ${
                clan.gameType === "RS3"
                  ? "bg-rs3/10 text-rs3 border-rs3/15"
                  : "bg-osrs/10 text-osrs border-osrs/15"
              }`}>
                {clan.gameType}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
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
