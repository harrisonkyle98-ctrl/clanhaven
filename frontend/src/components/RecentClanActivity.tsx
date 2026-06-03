import type { CSSProperties } from "react"
import { ChevronRight } from "lucide-react"
import CollapsiblePanel from "@/components/CollapsiblePanel"

interface ClanActivity {
  id: number
  type: "portal_launch" | "recruitment" | "competition" | "banner_update" | "milestone"
  clanName: string
  description: string
  timeAgo: string
  gameType: "RS3" | "OSRS"
}

const activityConfig: Record<ClanActivity["type"], { label: string; color: string }> = {
  portal_launch: { label: "Portal", color: "#a78bfa" },
  recruitment: { label: "Recruiting", color: "#60a5fa" },
  competition: { label: "Competition", color: "#c9a227" },
  banner_update: { label: "Updated", color: "#f472b6" },
  milestone: { label: "Milestone", color: "#6bc96b" },
}

const clanActivityFeed: ClanActivity[] = [
  {
    id: 1,
    type: "portal_launch",
    clanName: "Celestial Order",
    description: "Launched their clan portal with a custom banner and member directory",
    timeAgo: "18 minutes ago",
    gameType: "RS3",
  },
  {
    id: 2,
    type: "recruitment",
    clanName: "Iron Legacy",
    description: "Opened recruitment — looking for 1800+ total level ironmen",
    timeAgo: "42 minutes ago",
    gameType: "OSRS",
  },
  {
    id: 3,
    type: "competition",
    clanName: "Stormlight",
    description: "Created a new Woodcutting competition with 50M GP prize pool",
    timeAgo: "1 hour ago",
    gameType: "RS3",
  },
  {
    id: 4,
    type: "banner_update",
    clanName: "Dark Alliance",
    description: "Updated their clan banner and portal branding",
    timeAgo: "2 hours ago",
    gameType: "RS3",
  },
  {
    id: 5,
    type: "milestone",
    clanName: "Ancient Guard",
    description: "Reached 400 registered members",
    timeAgo: "3 hours ago",
    gameType: "OSRS",
  },
  {
    id: 6,
    type: "recruitment",
    clanName: "Phoenix Rising",
    description: "Opened recruitment — welcoming all skill levels",
    timeAgo: "4 hours ago",
    gameType: "RS3",
  },
  {
    id: 7,
    type: "competition",
    clanName: "Wilderness Wolves",
    description: "Launched a PvP kill-count challenge running through June",
    timeAgo: "5 hours ago",
    gameType: "OSRS",
  },
  {
    id: 8,
    type: "portal_launch",
    clanName: "Nova Collective",
    description: "Launched their clan portal with recruitment tools enabled",
    timeAgo: "6 hours ago",
    gameType: "RS3",
  },
]

export default function RecentClanActivity() {
  return (
    <CollapsiblePanel variant="blue" title="Recent Clan Activity">
      <div className="space-y-2">
        {clanActivityFeed.map((event) => {
          const { label, color } = activityConfig[event.type]
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
                  <span className="text-[10px] font-bold" style={{ color }}>{label[0]}</span>
                </div>

                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <span className="ch-log-username flex-shrink-0">{event.clanName}</span>
                    <span className={event.gameType === "RS3" ? "badge-rs3" : "badge-osrs"}>
                      {event.gameType}
                    </span>
                    <span className="ch-log-text truncate">{event.description}</span>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider mr-2 hidden sm:inline" style={{ color }}>{label}</span>
                    <span className="ch-log-timestamp whitespace-nowrap">{event.timeAgo}</span>
                    <ChevronRight className="ch-log-chevron w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </CollapsiblePanel>
  )
}
