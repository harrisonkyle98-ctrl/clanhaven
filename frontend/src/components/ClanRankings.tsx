import { useState } from "react"
import { topRS3Clans, topOSRSClans } from "@/data/mockData"
import type { RankedClan } from "@/data/mockData"
import CollapsiblePanel from "@/components/CollapsiblePanel"

type Tab = "rs3" | "osrs"

const tabs: { key: Tab; label: string }[] = [
  { key: "rs3", label: "RS3" },
  { key: "osrs", label: "OSRS" },
]

const tabData: Record<Tab, RankedClan[]> = {
  rs3: topRS3Clans,
  osrs: topOSRSClans,
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "text-gold",
    2: "text-zinc-300",
    3: "text-orange-400",
  }
  const colorClass = colors[rank] ?? "text-text-muted"
  return (
    <span className={`w-6 h-6 rounded-sm text-xs font-bold flex items-center justify-center ch-stat-cell ${colorClass}`}>
      {rank}
    </span>
  )
}

export default function ClanRankings() {
  const [activeTab, setActiveTab] = useState<Tab>("rs3")
  const clans = tabData[activeTab]

  const tabsElement = (
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
  )

  return (
    <CollapsiblePanel variant="blue" title="Clan Rankings" headerRight={tabsElement}>
      <div className="flex flex-col gap-2 flex-1">
        {clans.map((clan) => (
          <div
            key={clan.name}
            className="ch-row flex items-center gap-3 px-4 py-2.5 flex-1"
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
              <span className="text-xs font-semibold text-xp-green">+{clan.weeklyXp}</span>
            </div>
            <span className={clan.gameType === "RS3" ? "badge-rs3" : "badge-osrs"}>
              {clan.gameType}
            </span>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  )
}
