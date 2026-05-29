import { platformStats } from "@/data/mockData"
import { Shield, Users, TrendingUp, Trophy } from "lucide-react"

const stats = [
  { label: "Clans Tracked", value: platformStats.clansTracked.toLocaleString(), icon: Shield },
  { label: "Players Tracked", value: platformStats.playersTracked.toLocaleString(), icon: Users },
  { label: "XP Gained This Week", value: platformStats.xpGainedThisWeek, icon: TrendingUp },
  { label: "Active Competitions", value: platformStats.activeCompetitions.toLocaleString(), icon: Trophy },
]

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-background/80 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-16">
        {/* Main heading */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Tracking 847 clans across RuneScape
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-5">
            <span className="bg-gradient-to-r from-white via-white to-indigo-200 bg-clip-text text-transparent">
              Clan Haven
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The home for RuneScape clans. Track XP, compete in events, and grow
            your community — all in one platform.
          </p>
        </div>

        {/* Platform stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 text-center hover:border-indigo-500/40 transition-all duration-300"
            >
              <stat.icon className="w-5 h-5 text-indigo-400 mx-auto mb-2 opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
