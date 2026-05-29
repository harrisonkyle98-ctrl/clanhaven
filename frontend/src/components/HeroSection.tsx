import { platformStats } from "@/data/mockData"
import { Shield, Users, TrendingUp, Trophy } from "lucide-react"

const stats = [
  { label: "Clans", value: platformStats.clansTracked.toLocaleString(), icon: Shield, color: "text-gold" },
  { label: "Players", value: platformStats.playersTracked.toLocaleString(), icon: Users, color: "text-blue-400" },
  { label: "XP This Week", value: platformStats.xpGainedThisWeek, icon: TrendingUp, color: "text-xp-green" },
  { label: "Competitions", value: platformStats.activeCompetitions.toLocaleString(), icon: Trophy, color: "text-purple-400" },
]

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-sm border border-border bg-gradient-to-b from-[#0f1219] to-[#0a0c12]">
      {/* Atmospheric background layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-gold/[0.03] via-transparent to-rs3/[0.02]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gold/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </div>

      <div className="relative z-10 px-6 py-8 lg:py-10">
        {/* Identity */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-gold/40" />
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              Clan <span className="text-gold">Haven</span>
            </h1>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-gold/40" />
          </div>
          <p className="text-sm text-muted-foreground">
            The home of RuneScape clans
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <stat.icon className={`w-3.5 h-3.5 ${stat.color} opacity-60`} />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <div className="text-xl lg:text-2xl font-bold text-foreground">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
