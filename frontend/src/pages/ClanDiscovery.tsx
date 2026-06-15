import { useEffect, useState, useCallback, useRef } from "react"
import { Link } from "react-router-dom"
import { apiFetch } from "@/lib/api"
import { MiniClanVexillum } from "@/components/MiniClanVexillum"

interface IndexedClan {
  id: string
  name: string
  slug: string | null
  gameType: string
  memberCount: number
  rank: number | null
  totalXp: number | null
  primaryColor: string | null
  secondaryColor: string | null
  accentColor: string | null
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
  const [pageInput, setPageInput] = useState("1")
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState("xp")
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchClans = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "24",
        sort,
      })
      if (debouncedSearch) params.set("search", debouncedSearch)
      const data = await apiFetch<DiscoveryResponse>(`/api/clans/discovery?${params}`)
      setClans(data.clans)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      console.error("Failed to fetch clans:", err)
    } finally {
      setLoading(false)
    }
  }, [page, sort, debouncedSearch])

  useEffect(() => {
    fetchClans()
  }, [fetchClans])

  useEffect(() => {
    setPageInput(String(page))
  }, [page])

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = Math.max(1, Math.min(totalPages, Number(pageInput) || 1))
      setPage(val)
      setPageInput(String(val))
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 150)
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
            onChange={handleSearchChange}
          />
          <select
            className="ch-discovery-sort"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1) }}
          >
            <option value="xp">Total XP</option>
            <option value="members">Members</option>
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
              <Link key={clan.id} to={`/${clan.slug || clan.id}`} className="ch-stat-cell ch-discovery-card" style={{ textDecoration: "none" }}>
                {/* Card header with background image */}
                <div className="ch-discovery-card-header">
                  <img src="/images/clancardbg.png" alt="" className="ch-discovery-card-header-bg" />
                  <div className="ch-discovery-card-header-overlay" />
                  <div className="ch-discovery-card-header-content">
                    <div className="ch-discovery-card-header-center">
                      <div className="ch-discovery-card-name">{clan.name}</div>
                    </div>
                    <span className="badge-rs3">RS3</span>
                  </div>
                  <div className="ch-discovery-card-vexillum">
                    <MiniClanVexillum
                      primaryColor={clan.primaryColor ?? undefined}
                      secondaryColor={clan.secondaryColor ?? undefined}
                      accentColor={clan.accentColor ?? undefined}
                      size={72}
                    />
                  </div>
                </div>
                {/* Stats below the header image */}
                <div className="ch-discovery-card-stats">
                  <span className="ch-discovery-stat ch-stat-cell">
                    <span className="ch-discovery-stat-label">Rank</span>
                    <span className="ch-discovery-stat-value">{clan.rank ? clan.rank.toLocaleString() : "—"}</span>
                  </span>
                  <span className="ch-discovery-stat ch-stat-cell">
                    <span className="ch-discovery-stat-label">Members</span>
                    <span className="ch-discovery-stat-value">{clan.memberCount}</span>
                  </span>
                  <span className="ch-discovery-stat ch-stat-cell">
                    <span className="ch-discovery-stat-label">Total XP</span>
                    <span className="ch-discovery-stat-value ch-xp-green">{formatXp(clan.totalXp)}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="ch-discovery-pagination">
            <button
              className="ch-discovery-page-btn"
              onClick={() => setPage(1)}
              disabled={page === 1}
              title="First page"
            >
              &lt;&lt;
            </button>
            <button
              className="ch-discovery-page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              title="Previous page"
            >
              &lt;
            </button>
            <span className="ch-discovery-page-info">
              Page{" "}
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={handlePageInputKeyDown}
                onBlur={() => setPageInput(String(page))}
                style={{
                  width: `${Math.max(4, String(totalPages).length + 2)}ch`,
                  background: "rgba(22, 19, 14, 0.8)",
                  border: "none",
                  boxShadow: "inset 0 0 0 1px rgba(52, 45, 34, 0.6)",
                  color: "var(--color-text-warm)",
                  textAlign: "center",
                  padding: "0.15rem 0.3rem",
                  fontSize: "inherit",
                  fontFamily: "inherit",
                }}
              />
              {" "}of {totalPages.toLocaleString()}
            </span>
            <button
              className="ch-discovery-page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              title="Next page"
            >
              &gt;
            </button>
            <button
              className="ch-discovery-page-btn"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              title="Last page"
            >
              &gt;&gt;
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
