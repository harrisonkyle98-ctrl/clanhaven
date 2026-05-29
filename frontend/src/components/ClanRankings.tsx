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
    return <span className="w-6 h-6 rounded-sm text-xs font-bold flex items-center justify-center ch-stat-cell text-gold">1</span>
  }
  if (rank === 2) {
    return <span className="w-6 h-6 rounded-sm text-xs font-bold flex items-center justify-center ch-stat-cell text-zinc-300">2</span>
  }
  if (rank === 3) {
    return <span className="w-6 h-6 rounded-sm text-xs font-bold flex items-center justify-center ch-stat-cell text-orange-400">3</span>
  }
  return <span className="w-6 h-6 rounded-sm text-text-muted text-xs font-medium flex items-center justify-center">{rank}</span>
}

export default function ClanRankings() {
  const [activeTab, setActiveTab] = useState<Tab>("rs3")
  const clans = tabData[activeTab]

  return (
    <div className="ch-panel ch-panel--blue">
      <div className="ch-panel-header">
        <h2 className="ch-panel-header-title">Clan Rankings</h2>
        <div className="ch-panel-header-right">
          <div className="ch-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key) }}
                className={`ch-tab ${activeTab === tab.key ? "ch-tab-active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ch-panel-body space-y-2">
        {clans.map((clan) => (
          <div
            key={clan.name}
            className="ch-row flex items-center gap-3 px-4 py-2.5"
          >
            <RankBadge rank={clan.rank} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-highlight truncate">
                {clan.name}
              </div>
              <div className="text-[11px] text-text-muted">
                {clan.memberCount} members
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-[11px] text-text-muted">{clan.totalXp}</div>
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
            <span className={clan.gameType === "RS3" ? "badge-rs3" : "badge-osrs"}>
              {clan.gameType}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
