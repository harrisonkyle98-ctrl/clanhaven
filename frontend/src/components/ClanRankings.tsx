import { useState } from "react"
import { Link } from "react-router-dom"
import { topRS3Clans, topOSRSClans, fastestGrowingClans } from "@/data/mockData"
import type { RankedClan } from "@/data/mockData"
import { ChevronRight, TrendingUp } from "lucide-react"

type Tab = "rs3" | "osrs" | "growing"

const tabs: { key: Tab; label: string }[] = [
  { key: "rs3", label: "Top RS3" },
  { key: "osrs", label: "Top OSRS" },
  { key: "growing", label: "Fastest Growing" },
]

const tabData: Record<Tab, RankedClan[]> = {
  rs3: topRS3Clans,
  osrs: topOSRSClans,
  growing: fastestGrowingClans,
}

function RankBadge({ rank }: { rank: number }) {
  const colors = [
    "from-amber-400 to-amber-600 text-amber-950",
    "from-zinc-300 to-zinc-400 text-zinc-800",
    "from-orange-400 to-orange-600 text-orange-950",
  ]
  if (rank <= 3) {
    return (
      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-b ${colors[rank - 1]} text-xs font-bold`}>
        {rank}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground text-xs font-medium">
      {rank}
    </span>
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

export default function ClanRankings() {
  const [activeTab, setActiveTab] = useState<Tab>("rs3")
  const clans = tabData[activeTab]

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Clan Rankings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Top performing clans across RuneScape
          </p>
        </div>
        <Link
          to="/clans"
          className="hidden sm:flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View all clans <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-surface rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key) }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rankings table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="hidden sm:grid grid-cols-[3rem_1fr_6rem_6rem_6rem_6rem] gap-4 px-5 py-3 border-b border-border text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <div>#</div>
          <div>Clan</div>
          <div className="text-right">Members</div>
          <div className="text-right">Total XP</div>
          <div className="text-right">Weekly XP</div>
          <div className="text-right">{activeTab === "growing" ? "Growth" : "Type"}</div>
        </div>

        {clans.map((clan) => (
          <div
            key={clan.name}
            className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_6rem_6rem_6rem_6rem] gap-4 px-5 py-3.5 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors items-center"
          >
            <div>
              <RankBadge rank={clan.rank} />
            </div>
            <div className="font-medium flex items-center gap-2">
              {clan.name}
              <span className="sm:hidden"><GameBadge gameType={clan.gameType} /></span>
            </div>
            <div className="hidden sm:block text-right text-sm text-muted-foreground">
              {clan.memberCount.toLocaleString()}
            </div>
            <div className="hidden sm:block text-right text-sm font-medium">
              {clan.totalXp}
            </div>
            <div className="hidden sm:block text-right text-sm text-emerald-400 font-medium">
              +{clan.weeklyXp}
            </div>
            <div className="hidden sm:flex justify-end">
              {activeTab === "growing" && clan.growthPercent ? (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-400 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {clan.growthPercent}%
                </span>
              ) : (
                <GameBadge gameType={clan.gameType} />
              )}
            </div>
            <div className="sm:hidden text-right text-sm text-emerald-400 font-medium">
              +{clan.weeklyXp}
            </div>
          </div>
        ))}
      </div>

      <Link
        to="/clans"
        className="sm:hidden flex items-center justify-center gap-1 mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        View all clans <ChevronRight className="w-4 h-4" />
      </Link>
    </section>
  )
}
