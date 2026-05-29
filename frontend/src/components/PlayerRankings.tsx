import { topPlayers } from "@/data/mockData"

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

export default function PlayerRankings() {
  return (
    <div className="ch-panel ch-panel--amber">
      <div className="ch-panel-header">
        <h2 className="ch-panel-header-title">Trending Players</h2>
      </div>
      <div className="ch-panel-body space-y-2">
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
    </div>
  )
}
