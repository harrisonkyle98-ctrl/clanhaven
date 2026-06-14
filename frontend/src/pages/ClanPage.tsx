import { useEffect, useState, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import { apiFetch } from "@/lib/api"


interface ClanData {
  id: string
  name: string
  slug: string
  gameType: string
  memberCount: number
  rank: number | null
  totalXp: number | null
  motifUrl: string | null
  isVerified: boolean
  verifiedAt: string | null
  hasPublishedSite: boolean
  lastIndexedAt: string | null
  createdAt: string
}

interface RosterMember {
  id: string
  rsn: string
  clanRank: string | null
  clanXp: number
  kills: number
}

interface Authority {
  isManager: boolean
  rank: string | null
  matchedRsn: string | null
}

interface ClanPageResponse {
  clan: ClanData
  roster: RosterMember[]
  authority: Authority
}

function formatXp(xp: number | null): string {
  if (!xp) return "—"
  if (xp >= 1_000_000_000_000) return `${(xp / 1_000_000_000_000).toFixed(1)}T`
  if (xp >= 1_000_000_000) return `${(xp / 1_000_000_000).toFixed(1)}B`
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`
  return xp.toLocaleString()
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

type Tab = "overview" | "management"

export default function ClanPage() {
  const { slug } = useParams<{ slug: string }>()
  const [data, setData] = useState<ClanPageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("overview")
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const fetchClan = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<ClanPageResponse>(`/api/clans/page/${slug}`)
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clan")
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchClan()
  }, [fetchClan])

  const handleVerify = async () => {
    if (!data) return
    setVerifying(true)
    setVerifyError(null)
    try {
      await apiFetch(`/api/clans/page/${data.clan.slug}/verify`, { method: "POST" })
      await fetchClan()
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="ch-page-banner">
          <img src="/images/home-banner.jpg" alt="" className="ch-page-banner-img" />
          <div className="ch-page-banner-content">
            <h1 className="ch-page-banner-title">Loading...</h1>
          </div>
        </div>
        <div className="ch-page-content p-4 lg:p-6">
          <div className="ch-clan-loading">Loading clan data...</div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        <div className="ch-page-banner">
          <img src="/images/home-banner.jpg" alt="" className="ch-page-banner-img" />
          <div className="ch-page-banner-content">
            <h1 className="ch-page-banner-title">Clan Not Found</h1>
          </div>
        </div>
        <div className="ch-page-content p-4 lg:p-6">
          <div className="ch-clan-error">
            <p>{error || "This clan could not be found."}</p>
            <Link to="/clan-directory" className="ch-clan-back-link">← Back to Clan Directory</Link>
          </div>
        </div>
      </div>
    )
  }

  const { clan, roster, authority } = data
  const showManagement = authority.isManager

  return (
    <div>
      {/* Banner */}
      <div className="ch-page-banner">
        <img src="/images/home-banner.jpg" alt={`${clan.name} banner`} className="ch-page-banner-img" />
        <div className="ch-page-banner-content">
          <h1 className="ch-page-banner-title">
            {clan.name}
            {clan.isVerified && <span className="ch-clan-verified-badge" title="Verified Clan">✓</span>}
          </h1>
        </div>
      </div>

      <div className="ch-page-content p-4 lg:p-6 space-y-4">
        {/* Tabs */}
        <div className="ch-clan-tabs">
          <button
            className={`ch-clan-tab ${tab === "overview" ? "ch-clan-tab--active" : ""}`}
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
          {showManagement && (
            <button
              className={`ch-clan-tab ${tab === "management" ? "ch-clan-tab--active" : ""}`}
              onClick={() => setTab("management")}
            >
              Clan Management
            </button>
          )}
        </div>

        {tab === "overview" && (
          <>
            {/* Stats row */}
            <div className="ch-clan-stats-row">
              <div className="ch-stat-cell">
                <div className="relative z-1">
                  <div className="ch-stat-label">Members</div>
                  <div className="ch-stat-value">{clan.memberCount.toLocaleString()}</div>
                </div>
              </div>
              <div className="ch-stat-cell">
                <div className="relative z-1">
                  <div className="ch-stat-label">Total Clan XP</div>
                  <div className="ch-stat-value ch-xp-green">{formatXp(clan.totalXp)}</div>
                </div>
              </div>
              {clan.rank && (
                <div className="ch-stat-cell">
                  <div className="relative z-1">
                    <div className="ch-stat-label">Rank</div>
                    <div className="ch-stat-value">#{clan.rank.toLocaleString()}</div>
                  </div>
                </div>
              )}
              <div className="ch-stat-cell">
                <div className="relative z-1">
                  <div className="ch-stat-label">Last Indexed</div>
                  <div className="ch-stat-value" style={{ fontSize: "0.8125rem" }}>{formatDate(clan.lastIndexedAt)}</div>
                </div>
              </div>
            </div>

            {/* Member roster */}
            <div className="ch-clan-roster-wrapper">
              <div className="ch-clan-roster-header">
                <h2 className="ch-clan-roster-title">Clan Roster</h2>
                <span className="ch-clan-roster-count">{roster.length} members</span>
              </div>
              <div className="ch-clan-roster-table-wrap">
                <table className="ch-clan-roster-table">
                  <thead>
                    <tr>
                      <th className="ch-roster-th">RSN</th>
                      <th className="ch-roster-th">Rank</th>
                      <th className="ch-roster-th ch-roster-right">Clan XP</th>
                      <th className="ch-roster-th ch-roster-right">Kills</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((m) => (
                      <tr key={m.id} className="ch-roster-row">
                        <td className="ch-roster-td ch-roster-rsn">{m.rsn}</td>
                        <td className="ch-roster-td ch-roster-rank">{m.clanRank || "—"}</td>
                        <td className="ch-roster-td ch-roster-right">{formatXp(m.clanXp)}</td>
                        <td className="ch-roster-td ch-roster-right">{m.kills.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === "management" && showManagement && (
          <div className="ch-clan-management">
            <div className="ch-clan-mgmt-section">
              <h3 className="ch-clan-mgmt-heading">Clan Status</h3>
              <div className="ch-clan-mgmt-status">
                <div className="ch-clan-mgmt-status-row">
                  <span className="ch-clan-mgmt-label">Verification</span>
                  <span className={`ch-clan-mgmt-badge ${clan.isVerified ? "ch-clan-mgmt-badge--verified" : "ch-clan-mgmt-badge--unverified"}`}>
                    {clan.isVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
                {clan.isVerified && clan.verifiedAt && (
                  <div className="ch-clan-mgmt-status-row">
                    <span className="ch-clan-mgmt-label">Verified On</span>
                    <span className="ch-clan-mgmt-value">{formatDate(clan.verifiedAt)}</span>
                  </div>
                )}
                <div className="ch-clan-mgmt-status-row">
                  <span className="ch-clan-mgmt-label">Your Authority</span>
                  <span className="ch-clan-mgmt-value">{authority.rank} ({authority.matchedRsn})</span>
                </div>
              </div>
              {!clan.isVerified && (
                <div className="ch-clan-mgmt-verify">
                  <p className="ch-clan-mgmt-verify-text">
                    Verify this clan to unlock management features and mark it as officially managed.
                  </p>
                  <button
                    className="ch-clan-mgmt-verify-btn"
                    onClick={handleVerify}
                    disabled={verifying}
                  >
                    {verifying ? "Verifying..." : "Verify Clan"}
                  </button>
                  {verifyError && <p className="ch-clan-mgmt-error">{verifyError}</p>}
                </div>
              )}
            </div>

            {/* Future placeholder sections */}
            <div className="ch-clan-mgmt-section ch-clan-mgmt-placeholder">
              <h3 className="ch-clan-mgmt-heading">Site Builder</h3>
              <p className="ch-clan-mgmt-coming">Coming soon — create a custom clan website.</p>
            </div>
            <div className="ch-clan-mgmt-section ch-clan-mgmt-placeholder">
              <h3 className="ch-clan-mgmt-heading">Navigation</h3>
              <p className="ch-clan-mgmt-coming">Coming soon — customize your site navigation.</p>
            </div>
            <div className="ch-clan-mgmt-section ch-clan-mgmt-placeholder">
              <h3 className="ch-clan-mgmt-heading">Theme</h3>
              <p className="ch-clan-mgmt-coming">Coming soon — choose colors and layout for your clan site.</p>
            </div>
            <div className="ch-clan-mgmt-section ch-clan-mgmt-placeholder">
              <h3 className="ch-clan-mgmt-heading">Content</h3>
              <p className="ch-clan-mgmt-coming">Coming soon — manage your clan's homepage content.</p>
            </div>
            <div className="ch-clan-mgmt-section ch-clan-mgmt-placeholder">
              <h3 className="ch-clan-mgmt-heading">Pages</h3>
              <p className="ch-clan-mgmt-coming">Coming soon — create and manage additional pages.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
