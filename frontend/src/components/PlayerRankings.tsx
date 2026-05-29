import { topPlayers } from "@/data/mockData"
import CollapsiblePanel from "@/components/CollapsiblePanel"

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

export default function PlayerRankings() {
  return (
    <CollapsiblePanel variant="amber" title="Today's Top Players">
      <div className="space-y-2">
        {topPlayers.slice(0, 6).map((player) => (
          <div
            key={player.username}
            className="ch-row flex items-center gap-3 px-4 py-2.5"
          >
            <RankBadge rank={player.rank} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-highlight truncate">
                {player.username}
              </div>
              <div className="text-[11px] text-text-muted truncate">
                {player.clanName}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-xp-green">+{player.weeklyXp}</div>
              <div className="text-[10px] text-text-muted">{player.totalLevel.toLocaleString()} total</div>
            </div>
            <span className={player.gameType === "RS3" ? "badge-rs3" : "badge-osrs"}>
              {player.gameType}
            </span>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  )
}
