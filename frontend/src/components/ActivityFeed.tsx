import { recentActivity } from "@/data/mockData"
import type { ActivityEvent } from "@/data/mockData"
import { Star, Trophy, Users, Award, Plus, ChevronRight } from "lucide-react"
import type { CSSProperties } from "react"

const eventConfig: Record<ActivityEvent["type"], { Icon: typeof Star; color: string }> = {
  xp_milestone: { Icon: Star, color: "#c9a227" },
  competition_end: { Icon: Trophy, color: "#a78bfa" },
  clan_growth: { Icon: Users, color: "#60a5fa" },
  player_achievement: { Icon: Award, color: "#6bc96b" },
  new_clan: { Icon: Plus, color: "#22d3ee" },
}

export default function ActivityFeed() {
  return (
    <div className="ch-panel ch-panel--red">
      <div className="ch-panel-header">
        <h2 className="ch-panel-header-title">Live Activity</h2>
        <div className="ch-panel-header-right">
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-xp-green">
            <span className="w-1.5 h-1.5 rounded-full bg-xp-green animate-pulse" />
            Live
          </span>
        </div>
      </div>
      <div className="ch-panel-body space-y-2">
        {recentActivity.map((event) => {
          const { Icon, color } = eventConfig[event.type]
          return (
            <div
              key={event.id}
              className="ch-log-row"
              style={{ "--row-accent": color } as CSSProperties}
            >
              <div className="flex items-center gap-3 py-2 px-3">
                <div
                  className="ch-log-icon"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>

                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <span className="ch-log-username flex-shrink-0">{event.title}</span>
                    {event.gameType && (
                      <span className={event.gameType === "RS3" ? "badge-rs3" : "badge-osrs"}>
                        {event.gameType}
                      </span>
                    )}
                    <span className="ch-log-text truncate">{event.description}</span>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    {event.clanName && (
                      <span className="text-[11px] text-gold-dim mr-2 hidden sm:inline">{event.clanName}</span>
                    )}
                    <span className="ch-log-timestamp whitespace-nowrap">{event.timeAgo}</span>
                    <ChevronRight className="ch-log-chevron w-4 h-4" />
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
