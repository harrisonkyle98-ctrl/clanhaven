import { useState } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { apiFetch } from "@/lib/api"
import CollapsiblePanel from "@/components/CollapsiblePanel"

const TABS = [
  { id: "account", label: "Account" },
  { id: "linked-rsn", label: "Linked RSN" },
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
        {activeTab === "linked-rsn" && <LinkedRsnTab user={user} />}
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
  gameType: string | null
  accountType: string | null
  rsnClanName: string | null
  rsnLinkedAt: string | null
  privileges: number
  lastOnline: string | null
}

function AccountTab({ user }: { user: UserData }) {
  const discordAvatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discordId) % 5}.png`

  const roleName = user.privileges >= 2 ? "Administrator" : user.privileges === 1 ? "Moderator" : "Member"

  return (
    <div className="space-y-4">
      <CollapsiblePanel variant="blue" title="Discord Account">
        <div className="ch-admin-section">
          <div className="flex items-center gap-4" style={{ marginBottom: "1rem" }}>
            <img
              src={discordAvatarUrl}
              alt="Discord avatar"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "0",
                border: "1px solid rgba(100,140,180,0.3)",
              }}
              onError={(e) => { e.currentTarget.src = "/images/default-avatar.png" }}
            />
            <div>
              <div style={{ color: "#e8d5b0", fontWeight: 600, fontSize: "0.875rem" }}>
                {user.username}
              </div>
              <div style={{ color: "rgba(180,160,130,0.5)", fontSize: "0.6875rem" }}>
                Discord ID: {user.discordId}
              </div>
            </div>
          </div>
          <div className="ch-admin-status-row">
            <span className="ch-admin-status-label">Username</span>
            <span className="ch-admin-status-value">{user.username}</span>
          </div>
          <div className="ch-admin-status-row">
            <span className="ch-admin-status-label">Email</span>
            <span className="ch-admin-status-value">{user.email ?? "Not available"}</span>
          </div>
          <div className="ch-admin-status-row">
            <span className="ch-admin-status-label">Site Role</span>
            <span className="ch-admin-status-value ch-settings-highlight">{roleName}</span>
          </div>
          <div className="ch-admin-status-row">
            <span className="ch-admin-status-label">Last Online</span>
            <span className="ch-admin-status-value">
              {user.lastOnline ? new Date(user.lastOnline).toLocaleString() : "Now"}
            </span>
          </div>
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

function LinkedRsnTab({ user }: { user: UserData }) {
  const { refreshUser } = useAuth()
  const [unlinkLoading, setUnlinkLoading] = useState(false)

  function getRsAvatarUrl(rsn: string): string {
    return `https://secure.runescape.com/m=avatar-rs/${encodeURIComponent(rsn)}/chat.png`
  }

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

  return (
    <div className="space-y-4">
      <CollapsiblePanel variant="blue" title="Linked RuneScape Account">
        <div className="ch-admin-section">
          {user.rsn ? (
            <>
              <div className="flex items-center gap-4" style={{ marginBottom: "1rem" }}>
                <img
                  src={getRsAvatarUrl(user.rsn)}
                  alt="RS avatar"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "0",
                    border: "1px solid rgba(100,140,180,0.3)",
                  }}
                  onError={(e) => { e.currentTarget.src = "/images/default-avatar.png" }}
                />
                <div>
                  <div style={{ color: "#e8d5b0", fontWeight: 600, fontSize: "0.875rem" }}>
                    {user.rsn}
                  </div>
                  <div className="flex items-center gap-1.5" style={{ marginTop: "0.25rem" }}>
                    {user.gameType && (
                      <span className={user.gameType === "RS3" ? "badge-rs3" : "badge-osrs"}>
                        {user.gameType}
                      </span>
                    )}
                    {user.accountType === "ironman" && (
                      <span className="badge-ironman">Ironman</span>
                    )}
                    {user.accountType === "hardcore_ironman" && (
                      <span className="badge-hardcore">Hardcore</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="ch-admin-status-row">
                <span className="ch-admin-status-label">Display Name</span>
                <span className="ch-admin-status-value">{user.rsn}</span>
              </div>
              <div className="ch-admin-status-row">
                <span className="ch-admin-status-label">Game</span>
                <span className="ch-admin-status-value">{user.gameType ?? "Unknown"}</span>
              </div>
              <div className="ch-admin-status-row">
                <span className="ch-admin-status-label">Account Type</span>
                <span className="ch-admin-status-value" style={{ textTransform: "capitalize" }}>
                  {user.accountType?.replace(/_/g, " ") ?? "Normal"}
                </span>
              </div>
              <div className="ch-admin-status-row">
                <span className="ch-admin-status-label">Clan</span>
                <span className="ch-admin-status-value">{user.rsnClanName ?? "None"}</span>
              </div>
              <div className="ch-admin-status-row">
                <span className="ch-admin-status-label">Linked On</span>
                <span className="ch-admin-status-value">
                  {user.rsnLinkedAt ? new Date(user.rsnLinkedAt).toLocaleDateString() : "Unknown"}
                </span>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <button
                  onClick={handleUnlink}
                  disabled={unlinkLoading}
                  className="ch-mod-action-btn ch-mod-action-btn--danger"
                  style={{ fontSize: "0.6875rem", padding: "0.3rem 0.75rem" }}
                >
                  {unlinkLoading ? "Unlinking…" : "Unlink RSN"}
                </button>
                <span style={{ color: "rgba(180,160,130,0.4)", fontSize: "0.625rem", marginLeft: "0.75rem" }}>
                  You will need to re-link your RuneScape account after unlinking.
                </span>
              </div>
            </>
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

      <CollapsiblePanel variant="blue" title="Linking Information">
        <div className="ch-admin-section">
          <p style={{ color: "rgba(180,160,130,0.6)", fontSize: "0.6875rem", lineHeight: "1.6" }}>
            Your RuneScape account is linked to your Discord account for identity verification.
            This allows Clan Haven to display your in-game data, clan membership, and account status.
            Unlinking will remove your RSN association and require you to complete the verification
            process again on your next visit.
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
