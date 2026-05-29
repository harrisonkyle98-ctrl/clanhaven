import { Link } from "react-router-dom"
import { topPlayers } from "@/data/mockData"
import { ChevronRight } from "lucide-react"

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

export default function PlayerRankings() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Top Players</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Highest XP gainers this week
          </p>
        </div>
        <Link
          to="/clans"
          className="hidden sm:flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View all players <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="hidden sm:grid grid-cols-[3rem_1fr_10rem_7rem_5rem_4rem] gap-4 px-5 py-3 border-b border-border text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <div>#</div>
          <div>Player</div>
          <div>Clan</div>
          <div className="text-right">Weekly XP</div>
          <div className="text-right">Total Level</div>
          <div className="text-right">Game</div>
        </div>

        {topPlayers.map((player) => (
          <div
            key={player.username}
            className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_10rem_7rem_5rem_4rem] gap-4 px-5 py-3.5 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors items-center"
          >
            <div>
              <RankBadge rank={player.rank} />
            </div>
            <div>
              <span className="font-medium">{player.username}</span>
              <span className="sm:hidden text-xs text-muted-foreground ml-2">
                {player.clanName}
              </span>
            </div>
            <div className="hidden sm:block text-sm text-muted-foreground">
              {player.clanName}
            </div>
            <div className="hidden sm:block text-right text-sm text-emerald-400 font-medium">
              +{player.weeklyXp}
            </div>
            <div className="hidden sm:block text-right text-sm text-muted-foreground">
              {player.totalLevel.toLocaleString()}
            </div>
            <div className="hidden sm:flex justify-end">
              <GameBadge gameType={player.gameType} />
            </div>
            <div className="sm:hidden text-right text-sm text-emerald-400 font-medium">
              +{player.weeklyXp}
            </div>
          </div>
        ))}
      </div>

      <Link
        to="/clans"
        className="sm:hidden flex items-center justify-center gap-1 mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        View all players <ChevronRight className="w-4 h-4" />
      </Link>
    </section>
  )
}
