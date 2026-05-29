import { topPlayers } from "@/data/mockData"

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

export default function PlayerRankings() {
  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">Trending Players</div>
      <div>
        {topPlayers.slice(0, 6).map((player) => (
          <div
            key={player.username}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
          >
            <RankBadge rank={player.rank} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {player.username}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {player.clanName}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-xp-green">+{player.weeklyXp}</div>
              <div className="text-[10px] text-muted-foreground">{player.totalLevel.toLocaleString()} total</div>
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              player.gameType === "RS3"
                ? "bg-rs3/15 text-rs3"
                : "bg-osrs/15 text-osrs"
            }`}>
              {player.gameType}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
