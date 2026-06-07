import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api"

interface Highlight {
  title: string
  description: string
  image: string
  imagePosition?: string
  buttonText: string
  buttonLink: string
}

const fallbackHighlights: Highlight[] = [
  {
    title: "Clan Discovery",
    description: "Browse hundreds of active clans across RS3 and OSRS. Find your perfect community based on playstyle, size, and goals.",
    image: "/images/highlight-1.jpg",
    buttonText: "Explore",
    buttonLink: "/clans",
  },
  {
    title: "XP Tracking",
    description: "Monitor skill gains, milestones, and weekly progress for every member. Real-time hiscores integration keeps data fresh.",
    image: "/images/highlight-2.webp",
    buttonText: "Explore",
    buttonLink: "/rankings",
  },
  {
    title: "Competitions",
    description: "Create and join skill competitions between clans or within your own. Leaderboards, prizes, and bragging rights await.",
    image: "/images/highlight-3.png",
    buttonText: "Explore",
    buttonLink: "/competitions",
  },
  {
    title: "Clan Portals",
    description: "Create unique portals for your clan with customizable layouts, branding, and member management tools.",
    image: "/images/highlight-4.webp",
    imagePosition: "center bottom",
    buttonText: "Explore",
    buttonLink: "",
  },
]

interface ApiHighlight {
  id: string
  slotNumber: number
  imageUrl: string
  imagePosition: string
  title: string
  description: string
  buttonText: string
  buttonLink: string
}

export default function SiteHighlights() {
  const [highlights, setHighlights] = useState<Highlight[]>(fallbackHighlights)

  useEffect(() => {
    apiFetch<ApiHighlight[]>("/api/news/highlights")
      .then((data) => {
        if (data.length > 0) {
          setHighlights(
            data.map((h) => ({
              title: h.title,
              description: h.description,
              image: h.imageUrl,
              imagePosition: h.imagePosition || undefined,
              buttonText: h.buttonText || "Explore",
              buttonLink: h.buttonLink,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

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
            {item.buttonLink ? (
              <a href={item.buttonLink} className="ch-highlight-card-explore" style={{ textDecoration: "none" }}>{item.buttonText}</a>
            ) : (
              <button className="ch-highlight-card-explore">{item.buttonText}</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
