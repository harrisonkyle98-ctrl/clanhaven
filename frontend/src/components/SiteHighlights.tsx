const highlights = [
  {
    title: "Clan Discovery",
    description: "Browse hundreds of active clans across RS3 and OSRS. Find your perfect community based on playstyle, size, and goals.",
    image: "/images/highlight-1.jpg",
  },
  {
    title: "XP Tracking",
    description: "Monitor skill gains, milestones, and weekly progress for every member. Real-time hiscores integration keeps data fresh.",
    image: "/images/highlight-2.webp",
  },
  {
    title: "Competitions",
    description: "Create and join skill competitions between clans or within your own. Leaderboards, prizes, and bragging rights await.",
    image: "/images/highlight-3.png",
  },
  {
    title: "Community Hub",
    description: "Connect with fellow players through clan events, recruitment boards, and cross-clan diplomacy tools.",
    image: "/images/highlight-4.webp",
  },
]

export default function SiteHighlights() {
  return (
    <div className="ch-site-highlights">
      {highlights.map((item) => (
        <div key={item.title} className="ch-highlight-card">
          <div className="ch-highlight-card-image">
            <img src={item.image} alt={item.title} className="ch-highlight-card-img" />
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
