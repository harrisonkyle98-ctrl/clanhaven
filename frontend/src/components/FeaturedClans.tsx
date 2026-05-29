import { featuredClans } from "@/data/mockData"
import { Users, TrendingUp, Calendar } from "lucide-react"

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

export default function FeaturedClans() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Featured Clans</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Active communities making an impact
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {featuredClans.map((clan) => (
          <div
            key={clan.name}
            className="group rounded-xl border border-border bg-card overflow-hidden hover:border-indigo-500/30 transition-all duration-300"
          >
            {/* Banner */}
            <div className={`h-24 bg-gradient-to-br ${clan.bannerColor} relative`}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute top-3 right-3">
                <GameBadge gameType={clan.gameType} />
              </div>
              {/* Clan initial as logo placeholder */}
              <div className="absolute -bottom-5 left-4">
                <div className="w-10 h-10 rounded-lg bg-card border-2 border-border flex items-center justify-center text-lg font-bold text-foreground shadow-lg">
                  {clan.name[0]}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 pt-8">
              <h3 className="font-semibold text-foreground group-hover:text-indigo-300 transition-colors">
                {clan.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                {clan.tagline}
              </p>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <Users className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                  <div className="text-sm font-semibold">{clan.memberCount}</div>
                  <div className="text-[10px] text-muted-foreground">Members</div>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-emerald-400">+{clan.weeklyXp}</div>
                  <div className="text-[10px] text-muted-foreground">Weekly XP</div>
                </div>
                <div className="text-center">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                  <div className="text-sm font-semibold">{clan.founded}</div>
                  <div className="text-[10px] text-muted-foreground">Founded</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
