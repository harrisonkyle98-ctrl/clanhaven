import { recentActivity } from "@/data/mockData"
import type { ActivityEvent } from "@/data/mockData"
import { Star, Trophy, Users, Award, Plus } from "lucide-react"

function EventIcon({ type }: { type: ActivityEvent["type"] }) {
  const iconMap = {
    xp_milestone: { Icon: Star, color: "text-amber-400 bg-amber-400/10" },
    competition_end: { Icon: Trophy, color: "text-indigo-400 bg-indigo-400/10" },
    clan_growth: { Icon: Users, color: "text-emerald-400 bg-emerald-400/10" },
    player_achievement: { Icon: Award, color: "text-purple-400 bg-purple-400/10" },
    new_clan: { Icon: Plus, color: "text-sky-400 bg-sky-400/10" },
  }
  const { Icon, color } = iconMap[type]
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-4 h-4" />
    </div>
  )
}

function GameBadge({ gameType }: { gameType: "RS3" | "OSRS" }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
      gameType === "RS3"
        ? "bg-indigo-500/20 text-indigo-300"
        : "bg-amber-500/20 text-amber-300"
    }`}>
      {gameType}
    </span>
  )
}

export default function ActivityFeed() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Recent Activity</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Latest happenings across the platform
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {recentActivity.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-border/80 hover:bg-secondary/20 transition-all"
          >
            <EventIcon type={event.type} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-foreground">
                  {event.title}
                </span>
                {event.gameType && <GameBadge gameType={event.gameType} />}
              </div>
              <p className="text-sm text-muted-foreground leading-snug">
                {event.description}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {event.clanName && (
                  <span className="text-xs text-indigo-400">{event.clanName}</span>
                )}
                <span className="text-xs text-muted-foreground">{event.timeAgo}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
