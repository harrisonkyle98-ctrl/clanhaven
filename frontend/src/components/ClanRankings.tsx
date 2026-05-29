import { useState } from "react"
import { topRS3Clans, topOSRSClans, fastestGrowingClans } from "@/data/mockData"
import type { RankedClan } from "@/data/mockData"
import { TrendingUp } from "lucide-react"

type Tab = "rs3" | "osrs" | "growing"

const tabs: { key: Tab; label: string }[] = [
  { key: "rs3", label: "RS3" },
  { key: "osrs", label: "OSRS" },
  { key: "growing", label: "Growing" },
]

const tabData: Record<Tab, RankedClan[]> = {
  rs3: topRS3Clans,
  osrs: topOSRSClans,
  growing: fastestGrowingClans,
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <span className="w-6 h-6 rounded bg-gold/20 text-gold text-xs font-bold flex items-center justify-center">1</span>
  }
  if (rank === 2) {
    return <span className="w-6 h-6 rounded bg-zinc-400/15 text-zinc-300 text-xs font-bold flex items-center justify-center">2</span>
  }
  if (rank === 3) {
    return <span className="w-6 h-6 rounded bg-orange-500/15 text-orange-400 text-xs font-bold flex items-center justify-center">3</span>
  }
  return <span className="w-6 h-6 rounded text-muted-foreground text-xs font-medium flex items-center justify-center">{rank}</span>
}

export default function ClanRankings() {
  const [activeTab, setActiveTab] = useState<Tab>("rs3")
  const clans = tabData[activeTab]

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header flex items-center justify-between">
        <span>Clan Rankings</span>
        <div className="flex gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key) }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "bg-gold/15 text-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {clans.map((clan) => (
          <div
            key={clan.name}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
          >
            <RankBadge rank={clan.rank} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {clan.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {clan.memberCount} members
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-muted-foreground">{clan.totalXp}</div>
            </div>
            <div className="text-right">
              {activeTab === "growing" && clan.growthPercent ? (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-xp-green">
                  <TrendingUp className="w-3 h-3" />
                  {clan.growthPercent}%
                </span>
              ) : (
                <span className="text-xs font-semibold text-xp-green">+{clan.weeklyXp}</span>
              )}
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              clan.gameType === "RS3"
                ? "bg-rs3/15 text-rs3"
                : "bg-osrs/15 text-osrs"
            }`}>
              {clan.gameType}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
