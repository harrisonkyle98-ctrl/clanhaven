import CollapsiblePanel from "@/components/CollapsiblePanel"

const newsItems = [
  {
    id: 1,
    date: "May 27, 2026",
    title: "Clan Portals Beta Launch",
    description: "Customizable clan portals are now available in early beta. Create a unique identity for your clan with banners, layouts, and member tools.",
    tag: "Feature",
  },
  {
    id: 2,
    date: "May 24, 2026",
    title: "Competition System Overhaul",
    description: "Cross-clan competitions now support custom scoring rules, team brackets, and automated prize distribution.",
    tag: "Update",
  },
  {
    id: 3,
    date: "May 20, 2026",
    title: "Scheduled Maintenance — May 22",
    description: "Clan Haven will undergo brief maintenance on May 22 at 06:00 UTC. Expected downtime is approximately 30 minutes.",
    tag: "Maintenance",
  },
  {
    id: 4,
    date: "May 17, 2026",
    title: "OSRS Hiscores Integration Live",
    description: "Old School RuneScape hiscores data is now syncing in real time. Track member progress across both game versions.",
    tag: "Feature",
  },
  {
    id: 5,
    date: "May 14, 2026",
    title: "Recruitment Board Improvements",
    description: "Clans can now pin recruitment posts, set application requirements, and filter candidates by skill totals.",
    tag: "Update",
  },
]

const tagColors: Record<string, string> = {
  Feature: "text-emerald-400",
  Update: "text-sky-400",
  Maintenance: "text-amber-400",
}

export default function ClanHavenNews() {
  return (
    <CollapsiblePanel variant="blue" title="Clan Haven News">
      <div className="flex flex-col gap-2 flex-1">
        {newsItems.map((item) => (
          <div
            key={item.id}
            className="ch-row px-4 py-3 cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${tagColors[item.tag] ?? "text-text-muted"}`}>
                {item.tag}
              </span>
              <span className="text-[10px] text-text-muted">{item.date}</span>
            </div>
            <div className="text-sm font-medium text-text-highlight group-hover:text-gold transition-colors">
              {item.title}
            </div>
            <div className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
              {item.description}
            </div>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  )
}
