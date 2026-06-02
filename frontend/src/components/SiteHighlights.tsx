const highlights = [
  {
    title: "Clan Discovery",
    description: "Browse hundreds of active clans across RS3 and OSRS. Find your perfect community based on playstyle, size, and goals.",
    gradient: "from-amber-900/60 to-yellow-800/40",
    icon: "🏰",
  },
  {
    title: "XP Tracking",
    description: "Monitor skill gains, milestones, and weekly progress for every member. Real-time hiscores integration keeps data fresh.",
    gradient: "from-emerald-900/60 to-green-800/40",
    icon: "📊",
  },
  {
    title: "Competitions",
    description: "Create and join skill competitions between clans or within your own. Leaderboards, prizes, and bragging rights await.",
    gradient: "from-blue-900/60 to-indigo-800/40",
    icon: "🏆",
  },
  {
    title: "Community Hub",
    description: "Connect with fellow players through clan events, recruitment boards, and cross-clan diplomacy tools.",
    gradient: "from-purple-900/60 to-fuchsia-800/40",
    icon: "⚔️",
  },
]

export default function SiteHighlights() {
  return (
    <div className="ch-site-highlights">
      {highlights.map((item) => (
        <div key={item.title} className="ch-highlight-card">
          <div className={`ch-highlight-card-image bg-gradient-to-br ${item.gradient}`}>
            <span className="ch-highlight-card-icon">{item.icon}</span>
          </div>
          <div className="ch-highlight-card-body">
            <h3 className="ch-highlight-card-title">{item.title}</h3>
            <p className="ch-highlight-card-desc">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
