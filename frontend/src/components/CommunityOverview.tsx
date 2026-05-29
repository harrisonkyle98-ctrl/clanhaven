import { Gamepad2, Clock, Zap } from "lucide-react"

const onlineClans = [
  { name: "Celestial Order", members: 87, game: "RS3" as const },
  { name: "Iron Legacy", members: 142, game: "OSRS" as const },
  { name: "Dark Alliance", members: 64, game: "RS3" as const },
  { name: "Ancient Guard", members: 98, game: "OSRS" as const },
  { name: "Stormlight", members: 45, game: "RS3" as const },
]

export default function CommunityOverview() {
  return (
    <div className="ch-panel overflow-hidden">
      <div className="ch-panel-header justify-between">
        <span>Community</span>
        <span className="flex items-center gap-1.5 text-[10px] font-normal normal-case tracking-normal text-xp-green">
          <span className="w-1.5 h-1.5 rounded-full bg-xp-green animate-pulse" />
          2,847 online
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 relative z-1">
        <div className="p-3 text-center border-r border-border/60">
          <Gamepad2 className="w-4 h-4 text-rs3 mx-auto mb-1" />
          <div className="text-sm font-bold text-foreground">412</div>
          <div className="text-[10px] text-muted-foreground">RS3 Clans</div>
        </div>
        <div className="p-3 text-center border-r border-border/60">
          <Gamepad2 className="w-4 h-4 text-osrs mx-auto mb-1" />
          <div className="text-sm font-bold text-foreground">435</div>
          <div className="text-[10px] text-muted-foreground">OSRS Clans</div>
        </div>
        <div className="p-3 text-center">
          <Zap className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <div className="text-sm font-bold text-foreground">234</div>
          <div className="text-[10px] text-muted-foreground">Competitions</div>
        </div>
      </div>

      {/* Most active clans */}
      <div className="px-4 py-3 border-t border-border/60 relative z-1">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Clock className="w-3 h-3 text-gold-dim" />
          <span className="text-[10px] text-gold-dim font-semibold uppercase tracking-wider">Most Active Now</span>
        </div>
        <div className="space-y-2">
          {onlineClans.map((clan) => (
            <div key={clan.name} className="flex items-center justify-between">
              <span className="text-[13px] text-foreground">{clan.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-xp-green">{clan.members} online</span>
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded-sm border ${
                  clan.game === "RS3" ? "bg-rs3/10 text-rs3 border-rs3/15" : "bg-osrs/10 text-osrs border-osrs/15"
                }`}>
                  {clan.game}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
