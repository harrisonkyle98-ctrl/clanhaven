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
    <div className="panel overflow-hidden">
      <div className="panel-header flex items-center justify-between">
        <span>Community</span>
        <span className="flex items-center gap-1.5 text-[10px] font-normal normal-case tracking-normal text-xp-green">
          <span className="w-1.5 h-1.5 rounded-full bg-xp-green animate-pulse" />
          2,847 online
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-px bg-border">
        <div className="bg-panel p-3 text-center">
          <Gamepad2 className="w-4 h-4 text-rs3 mx-auto mb-1" />
          <div className="text-sm font-bold text-foreground">412</div>
          <div className="text-[10px] text-muted-foreground">RS3 Clans</div>
        </div>
        <div className="bg-panel p-3 text-center">
          <Gamepad2 className="w-4 h-4 text-osrs mx-auto mb-1" />
          <div className="text-sm font-bold text-foreground">435</div>
          <div className="text-[10px] text-muted-foreground">OSRS Clans</div>
        </div>
        <div className="bg-panel p-3 text-center">
          <Zap className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <div className="text-sm font-bold text-foreground">234</div>
          <div className="text-[10px] text-muted-foreground">Competitions</div>
        </div>
      </div>

      {/* Most active clans right now */}
      <div className="px-4 py-2.5 border-t border-border">
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Most Active Now</span>
        </div>
        <div className="space-y-1.5">
          {onlineClans.map((clan) => (
            <div key={clan.name} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{clan.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-xp-green">{clan.members} online</span>
                <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                  clan.game === "RS3" ? "bg-rs3/15 text-rs3" : "bg-osrs/15 text-osrs"
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
