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
    return <span className="w-6 h-6 rounded-sm bg-gold/15 text-gold text-xs font-bold flex items-center justify-center border border-gold/20">1</span>
  }
  if (rank === 2) {
    return <span className="w-6 h-6 rounded-sm bg-zinc-400/10 text-zinc-300 text-xs font-bold flex items-center justify-center border border-zinc-500/15">2</span>
  }
  if (rank === 3) {
    return <span className="w-6 h-6 rounded-sm bg-orange-500/10 text-orange-400 text-xs font-bold flex items-center justify-center border border-orange-500/15">3</span>
  }
  return <span className="w-6 h-6 rounded-sm text-muted-foreground text-xs font-medium flex items-center justify-center">{rank}</span>
}

export default function ClanRankings() {
  const [activeTab, setActiveTab] = useState<Tab>("rs3")
  const clans = tabData[activeTab]

  return (
    <div className="ch-panel overflow-hidden">
      <div className="ch-panel-header justify-between">
        <span>Clan Rankings</span>
        <div className="flex gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key) }}
              className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "bg-gold/12 text-gold border border-gold/20"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-1">
        {clans.map((clan, i) => (
          <div
            key={clan.name}
            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors ${
              i < clans.length - 1 ? "border-b border-border/60" : ""
            }`}
          >
            <RankBadge rank={clan.rank} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {clan.name}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {clan.memberCount} members
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-[11px] text-muted-foreground">{clan.totalXp}</div>
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
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border ${
              clan.gameType === "RS3"
                ? "bg-rs3/10 text-rs3 border-rs3/15"
                : "bg-osrs/10 text-osrs border-osrs/15"
            }`}>
              {clan.gameType}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
