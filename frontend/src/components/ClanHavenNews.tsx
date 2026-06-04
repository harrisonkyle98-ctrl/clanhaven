import { useEffect, useState } from "react"
import CollapsiblePanel from "@/components/CollapsiblePanel"
import { apiFetch } from "@/lib/api"

interface PublicNewsPost {
  id: string
  title: string
  content: string
  excerpt: string | null
  publishedAt: string | null
  createdAt: string
}

export default function ClanHavenNews() {
  const [posts, setPosts] = useState<PublicNewsPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<PublicNewsPost[]>("/api/news")
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <CollapsiblePanel variant="blue" title="Clan Haven News">
      <div className="flex flex-col gap-2 flex-1">
        {loading && (
          <div className="ch-row px-4 py-3">
            <span className="text-sm text-text-muted">Loading news…</span>
          </div>
        )}
        {!loading && posts.length === 0 && (
          <div className="ch-row px-4 py-3">
            <span className="text-sm text-text-muted">No news yet. Check back soon.</span>
          </div>
        )}
        {posts.map((item) => (
          <div
            key={item.id}
            className="ch-row px-4 py-3 cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-text-muted">
                {item.publishedAt ? formatDate(item.publishedAt) : formatDate(item.createdAt)}
              </span>
            </div>
            <div className="text-sm font-medium text-text-highlight group-hover:text-gold transition-colors">
              {item.title}
            </div>
            <div className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
              {item.excerpt || item.content}
            </div>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  )
}
