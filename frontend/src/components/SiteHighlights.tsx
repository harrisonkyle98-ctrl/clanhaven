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
    title: "Clan Portals",
    description: "Create unique portals for your clan with customizable layouts, branding, and member management tools.",
    image: "/images/highlight-4.webp",
    imagePosition: "center bottom",
  },
]

export default function SiteHighlights() {
  return (
    <div className="ch-site-highlights">
      {highlights.map((item) => (
        <div key={item.title} className="ch-highlight-card">
          <div className="ch-highlight-card-image">
            <img
              src={item.image}
              alt={item.title}
              className="ch-highlight-card-img"
              style={item.imagePosition ? { objectPosition: item.imagePosition } : undefined}
            />
          </div>
          <div className="ch-highlight-card-body">
            <h3 className="ch-highlight-card-title">{item.title}</h3>
            <p className="ch-highlight-card-desc">{item.description}</p>
            <button className="ch-highlight-card-explore">Explore</button>
          </div>
        </div>
      ))}
    </div>
  )
}
