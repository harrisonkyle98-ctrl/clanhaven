import { recentActivity } from "@/data/mockData"
import type { ActivityEvent } from "@/data/mockData"
import { Star, Trophy, Users, Award, Plus } from "lucide-react"

const eventConfig: Record<ActivityEvent["type"], { Icon: typeof Star; color: string }> = {
  xp_milestone: { Icon: Star, color: "text-gold" },
  competition_end: { Icon: Trophy, color: "text-purple-400" },
  clan_growth: { Icon: Users, color: "text-blue-400" },
  player_achievement: { Icon: Award, color: "text-xp-green" },
  new_clan: { Icon: Plus, color: "text-cyan-400" },
}

export default function ActivityFeed() {
  return (
    <div className="ch-panel">
      <div className="ch-panel-header justify-between">
        <span>Live Activity</span>
        <span className="flex items-center gap-1.5 text-[10px] font-normal normal-case tracking-normal text-xp-green">
          <span className="w-1.5 h-1.5 rounded-full bg-xp-green animate-pulse" />
          Live
        </span>
      </div>
      <div className="ch-panel-body space-y-2 relative z-1">
        {recentActivity.map((event) => {
          const { Icon, color } = eventConfig[event.type]
          return (
            <div
              key={event.id}
              className="ch-row flex items-start gap-3 px-4 py-3"
            >
              <div className="relative z-1 flex items-start gap-3 w-full">
                <div className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-text-highlight">{event.title}</span>
                    {event.gameType && (
                      <span className={event.gameType === "RS3" ? "badge-rs3" : "badge-osrs"}>
                        {event.gameType}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">{event.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {event.clanName && (
                      <span className="text-[11px] text-gold-dim">{event.clanName}</span>
                    )}
                    <span className="text-[11px] text-text-muted">{event.timeAgo}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
