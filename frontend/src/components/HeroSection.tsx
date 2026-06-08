import { platformStats } from "@/data/mockData"
import { Shield, Users, TrendingUp, Trophy } from "lucide-react"
import CollapsiblePanel from "@/components/CollapsiblePanel"

const stats = [
  { label: "Clans", value: platformStats.clansTracked.toLocaleString(), icon: Shield },
  { label: "Players", value: platformStats.playersTracked.toLocaleString(), icon: Users },
  { label: "XP This Week", value: platformStats.xpGainedThisWeek, icon: TrendingUp },
  { label: "Competitions", value: platformStats.activeCompetitions.toLocaleString(), icon: Trophy },
]

export default function HeroSection() {
  return (
    <CollapsiblePanel variant="gold" title="Clan Haven — The Home of RuneScape Clans">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="ch-stat-cell p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <stat.icon className="w-3.5 h-3.5 text-gold-dim opacity-70" />
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <div className="text-xl lg:text-2xl font-bold text-text-highlight">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  )
}
