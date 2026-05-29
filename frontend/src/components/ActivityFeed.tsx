import { recentActivity } from "@/data/mockData"
import type { ActivityEvent } from "@/data/mockData"
import { Star, Trophy, Users, Award, Plus } from "lucide-react"

const eventConfig: Record<ActivityEvent["type"], { Icon: typeof Star; color: string }> = {
  xp_milestone: { Icon: Star, color: "text-gold bg-gold/8 border-gold/15" },
  competition_end: { Icon: Trophy, color: "text-purple-400 bg-purple-400/8 border-purple-400/15" },
  clan_growth: { Icon: Users, color: "text-blue-400 bg-blue-400/8 border-blue-400/15" },
  player_achievement: { Icon: Award, color: "text-xp-green bg-xp-green/8 border-xp-green/15" },
  new_clan: { Icon: Plus, color: "text-cyan-400 bg-cyan-400/8 border-cyan-400/15" },
}

export default function ActivityFeed() {
  return (
    <div className="ch-panel overflow-hidden">
      <div className="ch-panel-header justify-between">
        <span>Live Activity</span>
        <span className="flex items-center gap-1.5 text-[10px] font-normal normal-case tracking-normal text-xp-green">
          <span className="w-1.5 h-1.5 rounded-full bg-xp-green animate-pulse" />
          Live
        </span>
      </div>
      <div className="relative z-1">
        {recentActivity.map((event, i) => {
          const { Icon, color } = eventConfig[event.type]
          return (
            <div
              key={event.id}
              className={`flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors ${
                i < recentActivity.length - 1 ? "border-b border-border/60" : ""
              }`}
            >
              <div className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 border ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-foreground">{event.title}</span>
                  {event.gameType && (
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded-sm border ${
                      event.gameType === "RS3"
                        ? "bg-rs3/10 text-rs3 border-rs3/15"
                        : "bg-osrs/10 text-osrs border-osrs/15"
                    }`}>
                      {event.gameType}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{event.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  {event.clanName && (
                    <span className="text-[11px] text-gold/60">{event.clanName}</span>
                  )}
                  <span className="text-[11px] text-muted-foreground">{event.timeAgo}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
