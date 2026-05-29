import { topPlayers } from "@/data/mockData"

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

export default function PlayerRankings() {
  return (
    <div className="ch-panel overflow-hidden">
      <div className="ch-panel-header">Trending Players</div>
      <div className="relative z-1">
        {topPlayers.slice(0, 6).map((player, i) => (
          <div
            key={player.username}
            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors ${
              i < 5 ? "border-b border-border/60" : ""
            }`}
          >
            <RankBadge rank={player.rank} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {player.username}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {player.clanName}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-xp-green">+{player.weeklyXp}</div>
              <div className="text-[10px] text-muted-foreground">{player.totalLevel.toLocaleString()} total</div>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border ${
              player.gameType === "RS3"
                ? "bg-rs3/10 text-rs3 border-rs3/15"
                : "bg-osrs/10 text-osrs border-osrs/15"
            }`}>
              {player.gameType}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
