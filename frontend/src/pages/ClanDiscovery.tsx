import { useEffect, useState, useCallback } from "react"
import { apiFetch } from "@/lib/api"

interface IndexedClan {
  id: string
  name: string
  gameType: string
  memberCount: number
  rank: number | null
  totalXp: number | null
  source: string
  lastIndexedAt: string | null
}

interface DiscoveryResponse {
  clans: IndexedClan[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function formatXp(xp: number | null): string {
  if (!xp) return "—"
  if (xp >= 1_000_000_000_000) return `${(xp / 1_000_000_000_000).toFixed(1)}T`
  if (xp >= 1_000_000_000) return `${(xp / 1_000_000_000).toFixed(1)}B`
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`
  return xp.toLocaleString()
}

export default function ClanDiscovery() {
  const [clans, setClans] = useState<IndexedClan[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState("rank")
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const fetchClans = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "24",
        sort,
      })
      if (search) params.set("search", search)
      const data = await apiFetch<DiscoveryResponse>(`/api/clans/discovery?${params}`)
      setClans(data.clans)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      console.error("Failed to fetch clans:", err)
    } finally {
      setLoading(false)
    }
  }, [page, sort, search])

  useEffect(() => {
    fetchClans()
  }, [fetchClans])

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setPage(1)
      setSearch(searchInput)
    }
  }

  return (
    <div>
      {/* Page banner — matches homepage pattern */}
      <div className="ch-page-banner">
        <img
          src="/images/home-banner.jpg"
          alt="Clan Directory banner"
          className="ch-page-banner-img"
        />
        <div className="ch-page-banner-content">
          <h1 className="ch-page-banner-title">Clan Directory</h1>
        </div>
      </div>

      <div className="ch-page-content p-4 lg:p-6 space-y-4">
        {/* Controls row */}
        <div className="ch-discovery-controls">
          <input
            type="text"
            className="ch-discovery-search"
            placeholder="Search clan name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <select
            className="ch-discovery-sort"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1) }}
          >
            <option value="rank">Rank</option>
            <option value="members">Members</option>
            <option value="xp">Total XP</option>
            <option value="name">Name</option>
            <option value="recent">Recently Indexed</option>
          </select>
          <span className="ch-discovery-count">{total.toLocaleString()} clans indexed</span>
        </div>

        {loading ? (
          <div className="ch-discovery-loading">Loading clans...</div>
        ) : clans.length === 0 ? (
          <div className="ch-discovery-empty">No clans found. Try a different search or check back later.</div>
        ) : (
          <div className="ch-discovery-grid">
            {clans.map((clan) => (
              <div key={clan.id} className="ch-stat-cell ch-discovery-card">
                <div className="relative z-1 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="ch-discovery-card-icon">
                        <span>{clan.name[0]}</span>
                      </div>
                      <div>
                        <div className="ch-discovery-card-name">{clan.name}</div>
                        {clan.rank && (
                          <div className="ch-discovery-card-rank">Rank #{clan.rank.toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                    <span className="badge-rs3">RS3</span>
                  </div>
                  <div className="ch-discovery-card-stats">
                    <span className="ch-discovery-stat">
                      <span className="ch-discovery-stat-label">Members</span>
                      <span className="ch-discovery-stat-value">{clan.memberCount}</span>
                    </span>
                    <span className="ch-discovery-stat">
                      <span className="ch-discovery-stat-label">Total XP</span>
                      <span className="ch-discovery-stat-value ch-xp-green">{formatXp(clan.totalXp)}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="ch-discovery-pagination">
            <button
              className="ch-discovery-page-btn"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              ««
            </button>
            <button
              className="ch-discovery-page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              «
            </button>
            <span className="ch-discovery-page-info">
              Page {page} of {totalPages.toLocaleString()}
            </span>
            <button
              className="ch-discovery-page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              »
            </button>
            <button
              className="ch-discovery-page-btn"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              »»
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
