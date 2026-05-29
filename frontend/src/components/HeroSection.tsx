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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="panel group hover:border-gold/20 transition-colors"
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color} opacity-70`} />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stat.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
