import { useState, useEffect, useCallback } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { apiFetch } from "@/lib/api"
import CollapsiblePanel from "@/components/CollapsiblePanel"

const TABS = [
  { id: "account", label: "Account" },
  { id: "preferences", label: "Preferences" },
  { id: "privacy", label: "Privacy & Security" },
] as const

type TabId = (typeof TABS)[number]["id"]

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>("account")

  if (loading) {
    return (
      <div className="ch-page-content p-6">
        <p style={{ color: "rgba(200,180,150,0.6)" }}>Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return (
    <div>
      <div className="ch-page-banner">
        <img
          src="/images/home-banner.jpg"
          alt="Settings banner"
          className="ch-page-banner-img"
        />
        <div className="ch-page-banner-content">
          <h1 className="ch-page-banner-title">
            Settings
          </h1>
        </div>
      </div>

      <div className="ch-page-content p-4 lg:p-6 space-y-4">
        {/* Tab navigation */}
        <div className="ch-admin-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`ch-admin-tab${activeTab === tab.id ? " ch-admin-tab--active ch-admin-tab--blue" : ""}`}
              onClick={() => { setActiveTab(tab.id) }}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "account" && <AccountTab user={user} />}
        {activeTab === "preferences" && <PreferencesTab />}
        {activeTab === "privacy" && <PrivacySecurityTab user={user} />}
      </div>
    </div>
  )
}

interface UserData {
  id: string
  discordId: string
  username: string
  avatar: string | null
  email: string | null
  rsn: string | null
  activeRsn: string | null
  displayRsn: string | null
  gameType: string | null
  accountType: string | null
  rsnClanName: string | null
  rsnLinkedAt: string | null
  privileges: number
  lastOnline: string | null
}

interface AltRequest {
  id: string
  rsn: string
  gameType: string
  accountType: string | null
  clanName: string | null
  status: string
  reviewNote: string | null
  createdAt: string
  reviewedAt: string | null
}

function AccountTab({ user }: { user: UserData }) {
  const { refreshUser } = useAuth()
  const [unlinkLoading, setUnlinkLoading] = useState(false)
  const [altRequests, setAltRequests] = useState<AltRequest[]>([])
  const [altLoading, setAltLoading] = useState(true)
  const [newAltRsn, setNewAltRsn] = useState("")
  const [newAltGame, setNewAltGame] = useState("RS3")
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [switchLoading, setSwitchLoading] = useState(false)
  const [showAltModal, setShowAltModal] = useState(false)

  const fetchAlts = useCallback(async () => {
    try {
      const data = await apiFetch<AltRequest[]>("/api/users/me/alt-accounts")
      setAltRequests(data)
    } catch {
      // ignore
    } finally {
      setAltLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAlts()
  }, [fetchAlts])

  const handleUnlink = async () => {
    if (!confirm("Unlink your RSN? You will need to complete the account linking process again.")) return
    setUnlinkLoading(true)
    try {
      await apiFetch("/api/users/me/unlink-rsn", { method: "POST" })
      await refreshUser()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Unlink failed")
    } finally {
      setUnlinkLoading(false)
    }
  }

  const handleSubmitAlt = async () => {
    const rsn = newAltRsn.trim()
    if (!rsn) return
    setSubmitLoading(true)
    setSubmitError("")
    try {
      await apiFetch("/api/users/me/alt-accounts", {
        method: "POST",
        body: JSON.stringify({ rsn, gameType: newAltGame }),
      })
      setNewAltRsn("")
      setShowAltModal(false)
      await fetchAlts()
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Request failed")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleSwitchIdentity = async (rsn: string | null) => {
    setSwitchLoading(true)
    try {
      await apiFetch("/api/users/me/active-identity", {
        method: "POST",
        body: JSON.stringify({ rsn }),
      })
      await refreshUser()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Switch failed")
    } finally {
      setSwitchLoading(false)
    }
  }

  const handleUnlinkAlt = async (altId: string, altRsn: string) => {
    if (!confirm(`Unlink alt account "${altRsn}"? This will remove it from your linked accounts.`)) return
    try {
      await apiFetch(`/api/users/me/alt-accounts/${altId}`, { method: "DELETE" })
      await refreshUser()
      await fetchAlts()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Unlink failed")
    }
  }



  return (
    <div className="space-y-4">
      {/* Main Account */}
      <CollapsiblePanel variant="blue" title="Main RuneScape Account">
        <div className="ch-admin-section">
          {user.rsn ? (
            <div className="ch-row px-4 py-3">
              <div className="flex items-center gap-3">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#e8d5b0", fontSize: "0.8125rem", fontWeight: 600, display: "flex", alignItems: "center" }}>
                    {user.rsn}
                    {(user.accountType === "ironman" || user.accountType === "hardcore_ironman") && (
                      <img
                        src={user.accountType === "hardcore_ironman" ? "/images/sprites/hardcore.png" : "/images/sprites/ironman.png"}
                        alt={user.accountType === "hardcore_ironman" ? "Hardcore Ironman" : "Ironman"}
                        title={user.accountType === "hardcore_ironman" ? "Hardcore Ironman" : "Ironman"}
                        style={{ width: "12px", height: "12px", objectFit: "contain", marginLeft: "4px" }}
                      />
                    )}
                    {!user.activeRsn && (
                      <span className="badge-active" style={{ marginLeft: "0.4rem" }}>Active</span>
                    )}
                  </div>
                  <div className="ch-user-row-details" style={{ marginTop: "0.2rem" }}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {user.rsnClanName && (
                        <span className="badge-clan">{user.rsnClanName}</span>
                      )}
                      {user.gameType && (
                        <span className={user.gameType === "RS3" ? "badge-rs3" : "badge-osrs"}>
                          {user.gameType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-end" }}>
                  {user.activeRsn && (
                    <button
                      onClick={() => { void handleSwitchIdentity(null) }}
                      disabled={switchLoading}
                      className="ch-mod-action-btn"
                      style={{ fontSize: "0.6875rem", padding: "0.25rem 0.6rem" }}
                    >
                      {switchLoading ? "…" : "Switch"}
                    </button>
                  )}
                  <button
                    onClick={handleUnlink}
                    disabled={unlinkLoading}
                    className="ch-mod-action-btn ch-mod-action-btn--danger"
                    style={{ fontSize: "0.6875rem", padding: "0.25rem 0.6rem" }}
                  >
                    {unlinkLoading ? "…" : "Unlink"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="ch-admin-placeholder" style={{ marginBottom: "0.75rem" }}>
                No RuneScape account is currently linked.
              </p>
              <p style={{ color: "rgba(180,160,130,0.5)", fontSize: "0.6875rem" }}>
                You will be prompted to link your RuneScape account when you close this page.
                The linking process verifies your identity through the RuneScape Hiscores.
              </p>
            </div>
          )}
        </div>
      </CollapsiblePanel>

      {/* Alt Accounts */}
      <CollapsiblePanel variant="blue" title="Alternate Accounts">
        <div className="ch-admin-section">
          {[...altRequests].sort((a, b) => {
            const order: Record<string, number> = { approved: 0, pending: 1, denied: 2 }
            return (order[a.status] ?? 3) - (order[b.status] ?? 3)
          }).map((alt) => {
            const isApproved = alt.status === "approved"
            const isPending = alt.status === "pending"
            const isDenied = alt.status === "denied"
            const isActive = isApproved && user.activeRsn?.toLowerCase() === alt.rsn.toLowerCase()
            return (
              <div
                key={alt.id}
                className="ch-row px-4 py-3"
                style={{ marginBottom: "0.25rem", ...(isDenied ? { opacity: 0.6 } : {}) }}
              >
                <div className="flex items-center gap-3">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#e8d5b0", fontSize: "0.8125rem", fontWeight: 600, display: "flex", alignItems: "center" }}>
                      {alt.rsn}
                      {(alt.accountType === "ironman" || alt.accountType === "hardcore_ironman") && (
                        <img
                          src={alt.accountType === "hardcore_ironman" ? "/images/sprites/hardcore.png" : "/images/sprites/ironman.png"}
                          alt={alt.accountType === "hardcore_ironman" ? "Hardcore Ironman" : "Ironman"}
                          title={alt.accountType === "hardcore_ironman" ? "Hardcore Ironman" : "Ironman"}
                          style={{ width: "12px", height: "12px", objectFit: "contain", marginLeft: "4px" }}
                        />
                      )}
                      {isApproved && <span className="badge-online" style={{ marginLeft: "0.4rem" }}>Approved</span>}
                      {isPending && <span className="badge-info" style={{ marginLeft: "0.4rem" }}>Pending</span>}
                      {isPending && <span className="badge-pending-date" style={{ marginLeft: "0.4rem" }}>Requested on {new Date(alt.createdAt).toLocaleDateString()}</span>}
                      {isDenied && <span className="badge-offline" style={{ marginLeft: "0.4rem" }}>Denied</span>}
                      {isActive && <span className="badge-active" style={{ marginLeft: "0.4rem" }}>Active</span>}
                    </div>
                    <div className="ch-user-row-details" style={{ marginTop: "0.2rem" }}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {alt.clanName && (
                          <span className="badge-clan">{alt.clanName}</span>
                        )}
                        <span className={alt.gameType === "RS3" ? "badge-rs3" : "badge-osrs"}>
                          {alt.gameType}
                        </span>
                      </div>
                    </div>
                    {isDenied && alt.reviewNote && (
                      <div style={{ color: "rgba(180,160,130,0.5)", fontSize: "0.625rem", marginTop: "0.3rem" }}>
                        Reason: {alt.reviewNote}
                      </div>
                    )}
                  </div>
                  {isApproved && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-end" }}>
                      {!isActive && (
                        <button
                          onClick={() => { void handleSwitchIdentity(alt.rsn) }}
                          disabled={switchLoading}
                          className="ch-mod-action-btn"
                          style={{ fontSize: "0.6875rem", padding: "0.25rem 0.6rem" }}
                        >
                          {switchLoading ? "…" : "Switch"}
                        </button>
                      )}
                      <button
                        onClick={() => { void handleUnlinkAlt(alt.id, alt.rsn) }}
                        className="ch-mod-action-btn ch-mod-action-btn--danger"
                        style={{ fontSize: "0.6875rem", padding: "0.25rem 0.6rem" }}
                      >
                        Unlink
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )
          })}

          {altLoading && (
            <p style={{ color: "rgba(180,160,130,0.5)", fontSize: "0.6875rem" }}>Loading alt accounts…</p>
          )}

          {/* Request Alt Button */}
          {user.rsn && (
            <div style={{ marginTop: "0.5rem" }}>
              <button
                onClick={() => { setShowAltModal(true); setSubmitError(""); setNewAltRsn(""); setNewAltGame("RS3") }}
                className="ch-mod-action-btn"
                style={{ fontSize: "0.75rem", padding: "0.4rem 1rem" }}
              >
                Request Alt
              </button>
            </div>
          )}

          {/* Alt Request Modal */}
          {showAltModal && (
            <div className="ch-rsn-modal-overlay">
              <div className="ch-rsn-modal">
                <button
                  type="button"
                  onClick={() => { setShowAltModal(false) }}
                  className="ch-rsn-modal-close"
                  aria-label="Close"
                >
                  ×
                </button>
                <div className="ch-rsn-modal-highlight" />
                <div className="ch-rsn-modal-header">
                  <h2 className="ch-rsn-modal-title">Request Alternate Account</h2>
                  <p className="ch-rsn-modal-subtitle">
                    Link an additional RuneScape account to your profile. Your request will be
                    reviewed by a moderator before the alt account is approved.
                  </p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); void handleSubmitAlt() }} className="ch-rsn-modal-form">
                  <div className="ch-rsn-modal-field">
                    <label className="ch-rsn-modal-label">RuneScape Display Name</label>
                    <input
                      type="text"
                      value={newAltRsn}
                      onChange={(e) => { setNewAltRsn(e.target.value) }}
                      placeholder="Enter alt RSN"
                      maxLength={12}
                      className="ch-rsn-modal-input"
                      autoFocus
                      disabled={submitLoading}
                    />
                  </div>

                  <div className="ch-rsn-modal-field">
                    <label className="ch-rsn-modal-label">Game</label>
                    <div className="ch-rsn-modal-game-toggle">
                      <button
                        type="button"
                        onClick={() => { setNewAltGame("RS3") }}
                        className={`ch-rsn-modal-game-btn ${newAltGame === "RS3" ? "ch-rsn-modal-game-btn--active" : ""}`}
                        disabled={submitLoading}
                      >
                        RS3
                      </button>
                      <button
                        type="button"
                        onClick={() => { setNewAltGame("OSRS") }}
                        className={`ch-rsn-modal-game-btn ${newAltGame === "OSRS" ? "ch-rsn-modal-game-btn--active" : ""}`}
                        disabled={submitLoading}
                      >
                        OSRS
                      </button>
                    </div>
                  </div>

                  {submitError && <div className="ch-rsn-modal-error">{submitError}</div>}

                  <button
                    type="submit"
                    disabled={submitLoading || !newAltRsn.trim()}
                    className="ch-rsn-modal-submit"
                  >
                    {submitLoading ? <span>Validating<span className="ch-rsn-modal-dots" /></span> : "Submit Request"}
                  </button>

                  <p className="ch-rsn-modal-note">
                    Your alt account will be verified against the RuneScape Hiscores and submitted for moderator approval.
                  </p>
                </form>
              </div>
            </div>
          )}
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel variant="blue" title="Account Actions">
        <div className="ch-admin-section">
          <p className="ch-admin-placeholder">
            Account management options such as data export, account deactivation, and notification
            preferences will be available here in future updates.
          </p>
        </div>
      </CollapsiblePanel>
    </div>
  )
}

function PreferencesTab() {
  return (
    <div className="space-y-4">
      <CollapsiblePanel variant="blue" title="Display Preferences">
        <div className="ch-admin-section">
          <p className="ch-admin-placeholder">
            Display preferences including theme selection, sidebar behavior, and notification
            settings will be available here in future updates.
          </p>
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel variant="blue" title="Communication Preferences">
        <div className="ch-admin-section">
          <p className="ch-admin-placeholder">
            Communication preferences such as Discord notification settings, email updates,
            and activity digests will be configurable here in future updates.
          </p>
        </div>
      </CollapsiblePanel>
    </div>
  )
}

function PrivacySecurityTab({ user }: { user: UserData }) {
  return (
    <div className="space-y-4">
      <CollapsiblePanel variant="blue" title="Login & Security">
        <div className="ch-admin-section">
          <div className="ch-admin-status-row">
            <span className="ch-admin-status-label">Authentication</span>
            <span className="ch-admin-status-value">Discord OAuth</span>
          </div>
          <div className="ch-admin-status-row">
            <span className="ch-admin-status-label">Account Status</span>
            <span className="ch-admin-status-value" style={{ color: "#4ade80" }}>Active</span>
          </div>
          <div className="ch-admin-status-row">
            <span className="ch-admin-status-label">Last Login</span>
            <span className="ch-admin-status-value">
              {user.lastOnline ? new Date(user.lastOnline).toLocaleString() : "Current session"}
            </span>
          </div>
          <p style={{ color: "rgba(180,160,130,0.4)", fontSize: "0.625rem", marginTop: "0.75rem" }}>
            Your account is secured through Discord&apos;s authentication system.
            Enable two-factor authentication on your Discord account for additional security.
          </p>
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel variant="blue" title="Privacy Settings">
        <div className="ch-admin-section">
          <p className="ch-admin-placeholder">
            Privacy controls including profile visibility, activity tracking preferences,
            and data management options will be available here in future updates.
          </p>
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel variant="blue" title="Sessions & Devices">
        <div className="ch-admin-section">
          <p className="ch-admin-placeholder">
            Active session management and device history will be available here in
            future updates. You will be able to view and revoke active sessions.
          </p>
        </div>
      </CollapsiblePanel>
    </div>
  )
}
