import { recentActivity } from "@/data/mockData"
import type { ActivityEvent } from "@/data/mockData"
import { Star, Trophy, Users, Award, Plus } from "lucide-react"

const eventConfig: Record<ActivityEvent["type"], { Icon: typeof Star; color: string }> = {
  xp_milestone: { Icon: Star, color: "text-gold bg-gold/10" },
  competition_end: { Icon: Trophy, color: "text-purple-400 bg-purple-400/10" },
  clan_growth: { Icon: Users, color: "text-blue-400 bg-blue-400/10" },
  player_achievement: { Icon: Award, color: "text-xp-green bg-xp-green/10" },
  new_clan: { Icon: Plus, color: "text-cyan-400 bg-cyan-400/10" },
}

export default function ActivityFeed() {
  return (
    <div className="panel overflow-hidden">
      <div className="panel-header flex items-center justify-between">
        <span>Live Activity</span>
        <span className="flex items-center gap-1.5 text-[10px] font-normal normal-case tracking-normal text-xp-green">
          <span className="w-1.5 h-1.5 rounded-full bg-xp-green animate-pulse" />
          Live
        </span>
      </div>
      <div>
        {recentActivity.map((event) => {
          const { Icon, color } = eventConfig[event.type]
          return (
            <div
              key={event.id}
              className="flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors"
            >
              <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-foreground">{event.title}</span>
                  {event.gameType && (
                    <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                      event.gameType === "RS3"
                        ? "bg-rs3/15 text-rs3"
                        : "bg-osrs/15 text-osrs"
                    }`}>
                      {event.gameType}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  {event.clanName && (
                    <span className="text-[11px] text-gold/70">{event.clanName}</span>
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
