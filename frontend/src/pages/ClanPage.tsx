import { useEffect, useState, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import { apiFetch } from "@/lib/api"
import { MiniClanVexillum } from "@/components/MiniClanVexillum"


interface ClanData {
  id: string
  name: string
  slug: string
  gameType: string
  memberCount: number
  rank: number | null
  totalXp: number | null
  motifUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  accentColor: string | null
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

const ROSTER_PAGE_SIZE = 25

export default function ClanPage() {
  const { slug } = useParams<{ slug: string }>()
  const [data, setData] = useState<ClanPageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("overview")
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [rosterPage, setRosterPage] = useState(1)

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
          <div className="ch-clanpage-layout">
            {/* Left: Clan Card */}
            <div className="ch-clanpage-card-col">
              <div className="ch-stat-cell ch-discovery-card ch-clanpage-card">
                <div className="ch-discovery-card-header">
                  <img src="/images/clancardbg.png" alt="" className="ch-discovery-card-header-bg" />
                  <div className="ch-discovery-card-header-overlay" />
                  <div className="ch-discovery-card-header-content">
                    <div className="ch-discovery-card-header-center">
                      <div className="ch-discovery-card-name">{clan.name}</div>
                    </div>
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
                <div className="ch-discovery-card-stats">
                  <span className="ch-discovery-stat ch-stat-cell">
                    <span className="ch-discovery-stat-label">Rank</span>
                    <span className="ch-discovery-stat-value">{clan.rank ? clan.rank.toLocaleString() : "—"}</span>
                  </span>
                  <span className="ch-discovery-stat ch-stat-cell">
                    <span className="ch-discovery-stat-label">Members</span>
                    <span className="ch-discovery-stat-value">{clan.memberCount.toLocaleString()}</span>
                  </span>
                  <span className="ch-discovery-stat ch-stat-cell">
                    <span className="ch-discovery-stat-label">Total XP</span>
                    <span className="ch-discovery-stat-value ch-xp-green">{formatXp(clan.totalXp)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Roster */}
            <div className="ch-clanpage-roster-col">
              {(() => {
                const totalRosterPages = Math.ceil(roster.length / ROSTER_PAGE_SIZE)
                const start = (rosterPage - 1) * ROSTER_PAGE_SIZE
                const pageMembers = roster.slice(start, start + ROSTER_PAGE_SIZE)
                return (
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
                          {pageMembers.map((m) => (
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
                    {totalRosterPages > 1 && (
                      <div className="ch-roster-pagination">
                        <button
                          className="ch-roster-page-btn"
                          onClick={() => setRosterPage((p) => Math.max(1, p - 1))}
                          disabled={rosterPage === 1}
                        >
                          Previous
                        </button>
                        <span className="ch-roster-page-info">
                          Page {rosterPage} of {totalRosterPages}
                        </span>
                        <button
                          className="ch-roster-page-btn"
                          onClick={() => setRosterPage((p) => Math.min(totalRosterPages, p + 1))}
                          disabled={rosterPage === totalRosterPages}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
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
