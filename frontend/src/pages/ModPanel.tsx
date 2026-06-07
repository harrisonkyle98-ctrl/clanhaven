import { useState, useEffect, useCallback } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { apiFetch } from "@/lib/api"
import CollapsiblePanel from "@/components/CollapsiblePanel"


const TABS = [
  { id: "home", label: "Home" },
  { id: "alt-accounts", label: "Alt Account Requests" },
  { id: "clan-verification", label: "Clan Verification" },
  { id: "site-moderation", label: "Site Moderation" },
] as const

type TabId = (typeof TABS)[number]["id"]

export default function ModPanel() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>("home")

  if (loading) {
    return (
      <div className="ch-page-content p-6">
        <p style={{ color: "rgba(200,180,150,0.6)" }}>Loading…</p>
      </div>
    )
  }

  if (!user || user.privileges < 1) {
    return <Navigate to="/" replace />
  }

  const roleName = user.privileges >= 2 ? "Administrator" : "Moderator"

  return (
    <div>
      <div className="ch-page-banner">
        <img
          src="/images/home-banner.jpg"
          alt="Mod banner"
          className="ch-page-banner-img"
        />
        <div className="ch-page-banner-content">
          <h1 className="ch-page-banner-title">
            Mod Panel
          </h1>
        </div>
      </div>

      <div className="ch-page-content p-4 lg:p-6 space-y-4">
        {/* Tab navigation */}
        <div className="ch-admin-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`ch-admin-tab${activeTab === tab.id ? " ch-admin-tab--active ch-admin-tab--green" : ""}`}
              onClick={() => { setActiveTab(tab.id) }}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "home" && <ModHomeTab username={user.rsn ?? user.username} role={roleName} />}
        {activeTab === "alt-accounts" && <ModAltAccountsTab />}
        {activeTab === "clan-verification" && <ModClanVerificationTab />}
        {activeTab === "site-moderation" && <ModSiteModerationTab />}
      </div>
    </div>
  )
}

function ModHomeTab({ username, role }: { username: string; role: string }) {
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<{ pendingAltRequests: number }>("/api/mod/status")
        setPendingCount(data.pendingAltRequests)
      } catch {
        // ignore
      }
    })()
  }, [])

  return (
    <div className="space-y-4">
      <CollapsiblePanel variant="green" title="Moderator Overview">
        <div className="ch-admin-overview">
          <p className="ch-admin-welcome">
            Welcome back, <span className="ch-mod-highlight">{username}</span>
          </p>
          <p className="ch-admin-description">
            This is the Clan Haven moderation panel. From here you can review and manage
            moderation requests, verify clans, and oversee community activity.
          </p>
        </div>
      </CollapsiblePanel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CollapsiblePanel variant="green" title="Moderator Status">
          <div className="ch-admin-section">
            <div className="ch-admin-status-row">
              <span className="ch-admin-status-label">Your Role</span>
              <span className="ch-admin-status-value ch-mod-highlight">{role}</span>
            </div>
            <div className="ch-admin-status-row">
              <span className="ch-admin-status-label">Pending Alt Requests</span>
              <span className="ch-admin-status-value">{pendingCount ?? "…"}</span>
            </div>
            <div className="ch-admin-status-row">
              <span className="ch-admin-status-label">Pending Clan Verifications</span>
              <span className="ch-admin-status-value">0</span>
            </div>
            <div className="ch-admin-status-row">
              <span className="ch-admin-status-label">Open Moderation Items</span>
              <span className="ch-admin-status-value">0</span>
            </div>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel variant="green" title="Quick Actions">
          <div className="ch-admin-section">
            <p className="ch-admin-placeholder">
              Moderation tools including alt account review, clan verification queues,
              and content moderation actions will be available here in future updates.
            </p>
          </div>
        </CollapsiblePanel>
      </div>

      <CollapsiblePanel variant="green" title="Moderation Modules">
        <div className="ch-admin-section">
          <div className="ch-admin-modules-grid">
            {[
              { title: "Alt Account Requests", desc: "Review and approve or deny alt account link requests" },
              { title: "Clan Verification", desc: "Verify clan ownership and approve clan applications" },
              { title: "Site Moderation", desc: "Review reported content and manage user warnings" },
              { title: "Moderation Logs", desc: "View a history of all moderation actions taken" },
            ].map((mod) => (
              <div key={mod.title} className="ch-admin-module-card">
                <div className="ch-admin-module-title">{mod.title}</div>
                <div className="ch-admin-module-desc">{mod.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </CollapsiblePanel>
    </div>
  )
}

interface AltRequestMod {
  id: string
  userId: string
  rsn: string
  gameType: string
  accountType: string | null
  status: string
  reviewedById: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
  requesterUsername: string | null
  requesterRsn: string | null
  requesterAvatar: string | null
  requesterDiscordId: string | null
}

function getRsAvatarUrl(rsn: string): string {
  return `https://secure.runescape.com/m=avatar-rs/${encodeURIComponent(rsn)}/chat.png`
}

function ModAltAccountsTab() {
  const [requests, setRequests] = useState<AltRequestMod[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "denied">("pending")

  const fetchRequests = useCallback(async () => {
    try {
      const data = await apiFetch<AltRequestMod[]>("/api/mod/alt-requests")
      setRequests(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRequests()
  }, [fetchRequests])

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      await apiFetch(`/api/mod/alt-requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ note: noteInputs[id] || null }),
      })
      await fetchRequests()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Approve failed")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeny = async (id: string) => {
    setActionLoading(id)
    try {
      await apiFetch(`/api/mod/alt-requests/${id}/deny`, {
        method: "POST",
        body: JSON.stringify({ note: noteInputs[id] || null }),
      })
      await fetchRequests()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Deny failed")
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter)
  const pendingCount = requests.filter((r) => r.status === "pending").length

  return (
    <div className="space-y-4">
      <CollapsiblePanel variant="green" title="Alt Account Requests">
        <div className="ch-admin-section">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <span style={{ color: "#e8d5b0", fontSize: "0.75rem", fontWeight: 600 }}>
              Filter:
            </span>
            {(["pending", "approved", "denied", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f) }}
                className="ch-mod-action-btn"
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.2rem 0.6rem",
                  opacity: filter === f ? 1 : 0.5,
                  textTransform: "capitalize",
                }}
              >
                {f}{f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
              </button>
            ))}
          </div>

          {loading && (
            <p style={{ color: "rgba(180,160,130,0.5)", fontSize: "0.6875rem" }}>Loading requests…</p>
          )}

          {!loading && filtered.length === 0 && (
            <p className="ch-admin-placeholder">
              No {filter === "all" ? "" : filter + " "}alt account requests found.
            </p>
          )}

          {filtered.map((req) => {
            const isPending = req.status === "pending"
            const discordAvatar = req.requesterAvatar && req.requesterDiscordId
              ? `https://cdn.discordapp.com/avatars/${req.requesterDiscordId}/${req.requesterAvatar}.png?size=64`
              : null

            return (
              <div
                key={req.id}
                className="ch-row px-4 py-3"
                style={{ marginBottom: "0.5rem" }}
              >
                {/* Row 1: Requester info */}
                <div className="flex items-center gap-3" style={{ marginBottom: "0.5rem" }}>
                  {discordAvatar && (
                    <img
                      src={discordAvatar}
                      alt=""
                      style={{ width: "28px", height: "28px", border: "1px solid rgba(100,180,130,0.3)" }}
                      onError={(e) => { e.currentTarget.src = "/images/default-avatar.png" }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#e8d5b0", fontSize: "0.8125rem", fontWeight: 600 }}>
                      {req.requesterUsername ?? "Unknown User"}
                      {req.requesterRsn && (
                        <span style={{ color: "rgba(180,160,130,0.6)", fontSize: "0.6875rem", marginLeft: "0.5rem", fontWeight: 400 }}>
                          (Main: {req.requesterRsn})
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ color: "rgba(180,160,130,0.4)", fontSize: "0.625rem" }}>
                    {new Date(req.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* Row 2: Requested RSN */}
                <div className="flex items-center gap-3" style={{ marginBottom: isPending ? "0.5rem" : 0 }}>
                  <img
                    src={getRsAvatarUrl(req.rsn)}
                    alt=""
                    style={{ width: "32px", height: "32px", border: "1px solid rgba(100,180,130,0.3)" }}
                    onError={(e) => { e.currentTarget.src = "/images/default-avatar.png" }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#e8d5b0", fontSize: "0.8125rem", display: "flex", alignItems: "center" }}>
                      Requesting:&nbsp;<span style={{ fontWeight: 600 }}>{req.rsn}</span>
                      {(req.accountType === "ironman" || req.accountType === "hardcore_ironman") && (
                        <img
                          src={req.accountType === "hardcore_ironman" ? "/images/sprites/hardcore.png" : "/images/sprites/ironman.png"}
                          alt={req.accountType === "hardcore_ironman" ? "Hardcore Ironman" : "Ironman"}
                          title={req.accountType === "hardcore_ironman" ? "Hardcore Ironman" : "Ironman"}
                          style={{ width: "12px", height: "12px", objectFit: "contain", marginLeft: "4px" }}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5" style={{ marginTop: "0.2rem" }}>
                      <span className={req.gameType === "RS3" ? "badge-rs3" : "badge-osrs"}>
                        {req.gameType}
                      </span>
                      {req.status === "pending" && <span className="badge-info">Pending</span>}
                      {req.status === "approved" && <span className="badge-online">Approved</span>}
                      {req.status === "denied" && <span className="badge-offline">Denied</span>}
                    </div>
                  </div>
                </div>

                {/* Review note (for already reviewed) */}
                {!isPending && req.reviewNote && (
                  <div style={{ color: "rgba(180,160,130,0.5)", fontSize: "0.625rem", marginTop: "0.3rem" }}>
                    Note: {req.reviewNote}
                  </div>
                )}
                {!isPending && req.reviewedAt && (
                  <div style={{ color: "rgba(180,160,130,0.4)", fontSize: "0.625rem", marginTop: "0.2rem" }}>
                    Reviewed: {new Date(req.reviewedAt).toLocaleString()}
                  </div>
                )}

                {/* Actions for pending requests */}
                {isPending && (
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      value={noteInputs[req.id] ?? ""}
                      onChange={(e) => { setNoteInputs((prev) => ({ ...prev, [req.id]: e.target.value })) }}
                      placeholder="Note (optional)"
                      className="ch-admin-input"
                      style={{ width: "200px", fontSize: "0.6875rem" }}
                    />
                    <button
                      onClick={() => { void handleApprove(req.id) }}
                      disabled={actionLoading === req.id}
                      className="ch-mod-action-btn"
                      style={{ fontSize: "0.6875rem", padding: "0.25rem 0.6rem" }}
                    >
                      {actionLoading === req.id ? "…" : "Approve"}
                    </button>
                    <button
                      onClick={() => { void handleDeny(req.id) }}
                      disabled={actionLoading === req.id}
                      className="ch-mod-action-btn ch-mod-action-btn--danger"
                      style={{ fontSize: "0.6875rem", padding: "0.25rem 0.6rem" }}
                    >
                      {actionLoading === req.id ? "…" : "Deny"}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CollapsiblePanel>
    </div>
  )
}

function ModClanVerificationTab() {
  return (
    <div className="space-y-4">
      <CollapsiblePanel variant="green" title="Clan Verification Requests">
        <div className="ch-admin-section">
          <p className="ch-admin-placeholder">
            This section will allow moderators to review and approve clan verification requests.
            Clan owners who want their clan officially verified on Clan Haven will submit
            applications for moderator review.
          </p>
          <div className="ch-admin-status-row" style={{ marginTop: "1rem" }}>
            <span className="ch-admin-status-label">Pending Verifications</span>
            <span className="ch-admin-status-value">0</span>
          </div>
          <p className="ch-admin-placeholder" style={{ marginTop: "0.75rem", fontSize: "0.625rem" }}>
            Moderators will be able to: review the clan's hiscores data, confirm the applicant
            is a clan leader, check the clan meets verification requirements, approve or deny
            the verification, and add notes to the decision.
          </p>
        </div>
      </CollapsiblePanel>
    </div>
  )
}

function ModSiteModerationTab() {
  return (
    <div className="space-y-4">
      <CollapsiblePanel variant="green" title="Site Moderation">
        <div className="ch-admin-section">
          <p className="ch-admin-placeholder">
            This section will provide general site moderation tools for managing
            community content and user behavior.
          </p>
          <div className="ch-admin-status-row" style={{ marginTop: "1rem" }}>
            <span className="ch-admin-status-label">Open Reports</span>
            <span className="ch-admin-status-value">0</span>
          </div>
          <p className="ch-admin-placeholder" style={{ marginTop: "0.75rem", fontSize: "0.625rem" }}>
            Moderators will be able to: review reported content and users, issue warnings
            or mutes, escalate issues to administrators, manage temporary restrictions,
            and maintain moderation logs.
          </p>
        </div>
      </CollapsiblePanel>
    </div>
  )
}
