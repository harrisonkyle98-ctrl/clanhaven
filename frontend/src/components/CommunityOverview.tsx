import CollapsiblePanel from "@/components/CollapsiblePanel"

const onlineClans = [
  { name: "Celestial Order", members: 87, game: "RS3" as const },
  { name: "Iron Legacy", members: 142, game: "OSRS" as const },
  { name: "Dark Alliance", members: 64, game: "RS3" as const },
  { name: "Ancient Guard", members: 98, game: "OSRS" as const },
  { name: "Stormlight", members: 45, game: "RS3" as const },
]

export default function CommunityOverview() {
  return (
    <CollapsiblePanel variant="green" title="Community">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="ch-stat-cell p-3 text-center">
          <div className="text-sm font-bold text-text-highlight">412</div>
          <div className="text-[10px] text-text-muted">RS3 Clans</div>
        </div>
        <div className="ch-stat-cell p-3 text-center">
          <div className="text-sm font-bold text-text-highlight">435</div>
          <div className="text-[10px] text-text-muted">OSRS Clans</div>
        </div>
        <div className="ch-stat-cell p-3 text-center">
          <div className="text-sm font-bold text-text-highlight">234</div>
          <div className="text-[10px] text-text-muted">Competitions</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[10px] text-gold-dim font-semibold uppercase tracking-wider">Most Active Now</span>
      </div>
      <div className="flex flex-col gap-1.5 flex-1">
        {onlineClans.map((clan) => (
          <div key={clan.name} className="ch-row flex items-center justify-between px-3 py-2 flex-1">
            <span className="text-[13px] text-text-warm relative z-1">{clan.name}</span>
            <div className="flex items-center gap-2 relative z-1">
              <span className="text-[11px] text-xp-green">{clan.members} online</span>
              <span className={clan.game === "RS3" ? "badge-rs3" : "badge-osrs"}>
                {clan.game}
              </span>
            </div>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  )
}
