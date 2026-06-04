import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { apiFetch } from "@/lib/api"
import CollapsiblePanel from "@/components/CollapsiblePanel"


const TABS = [
  { id: "home", label: "Home" },
  { id: "users", label: "Users" },
] as const

const FUTURE_TABS = [
  { label: "News" },
  { label: "Clans" },
  { label: "Site Settings" },
  { label: "Content" },
]

type TabId = (typeof TABS)[number]["id"]

export default function AdminPanel() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabId>("home")

  if (loading) {
    return (
      <div className="ch-page-content p-6">
        <p style={{ color: "rgba(200,180,150,0.6)" }}>Loading…</p>
      </div>
    )
  }

  if (!user || user.privileges !== 1) {
    return <Navigate to="/" replace />
  }

  return (
    <div>
      <div className="ch-page-banner">
        <img
          src="/images/home-banner.jpg"
          alt="Admin banner"
          className="ch-page-banner-img"
        />
        <div className="ch-page-banner-content">
          <h1 className="ch-page-banner-title">
            Admin Panel
          </h1>
        </div>
      </div>

      <div className="ch-page-content p-4 lg:p-6 space-y-4">
        {/* Tab navigation */}
        <div className="ch-admin-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`ch-admin-tab${activeTab === tab.id ? " ch-admin-tab--active" : ""}`}
              onClick={() => { setActiveTab(tab.id) }}
            >
              <span>{tab.label}</span>
            </button>
          ))}
          {FUTURE_TABS.map((tab) => (
            <button
              key={tab.label}
              className="ch-admin-tab ch-admin-tab--disabled"
              disabled
              title="Coming soon"
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "home" && <AdminHomeTab username={user.rsn ?? user.username} />}
        {activeTab === "users" && <AdminUsersTab />}
      </div>
    </div>
  )
}

function AdminHomeTab({ username }: { username: string }) {
  return (
    <div className="space-y-4">
      <CollapsiblePanel variant="purple" title="Admin Overview">
        <div className="ch-admin-overview">
          <p className="ch-admin-welcome">
            Welcome back, <span className="ch-admin-highlight">{username}</span>
          </p>
          <p className="ch-admin-description">
            This is the Clan Haven administration panel. From here you can manage
            site content, users, clans, and settings.
          </p>
        </div>
      </CollapsiblePanel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CollapsiblePanel variant="purple" title="Site Status">
          <div className="ch-admin-section">
            <div className="ch-admin-status-row">
              <span className="ch-admin-status-label">Your Role</span>
              <span className="ch-admin-status-value ch-admin-highlight">Site Administrator</span>
            </div>
            <div className="ch-admin-status-row">
              <span className="ch-admin-status-label">Auth System</span>
              <span className="ch-admin-status-value">Discord OAuth</span>
            </div>
            <div className="ch-admin-status-row">
              <span className="ch-admin-status-label">Identity System</span>
              <span className="ch-admin-status-value">RuneScape Hiscores</span>
            </div>
            <div className="ch-admin-status-row">
              <span className="ch-admin-status-label">Clan Indexing</span>
              <span className="ch-admin-status-value">Active (RS3)</span>
            </div>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel variant="purple" title="Quick Actions">
          <div className="ch-admin-section">
            <p className="ch-admin-placeholder">
              Homepage content management, news publishing, and site configuration
              controls will be available here in future updates.
            </p>
          </div>
        </CollapsiblePanel>
      </div>

      <CollapsiblePanel variant="purple" title="Management Modules">
        <div className="ch-admin-section">
          <div className="ch-admin-modules-grid">
            {[
              { title: "News Management", desc: "Create and manage Clan Haven news articles" },
              { title: "User Management", desc: "View and manage registered users" },
              { title: "Clan Management", desc: "Manage indexed clans and membership data" },
              { title: "Site Settings", desc: "Configure site-wide settings and preferences" },
              { title: "Content Editor", desc: "Edit homepage content and featured sections" },
              { title: "Audit Log", desc: "View administrative action history" },
            ].map((mod) => (
              <div key={mod.title} className="ch-admin-module-card">
                <h4 className="ch-admin-module-title">{mod.title}</h4>
                <p className="ch-admin-module-desc">{mod.desc}</p>
                <span className="ch-admin-module-badge">Coming Soon</span>
              </div>
            ))}
          </div>
        </div>
      </CollapsiblePanel>
    </div>
  )
}


interface AdminUser {
  id: string
  discordId: string
  username: string
  avatar: string | null
  rsn: string | null
  gameType: string | null
  rsnClanName: string | null
  rsnLinkedAt: string | null
  privileges: number
  lastOnline: string | null
  createdAt: string
  updatedAt: string
}

function AdminUsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<AdminUser[]>("/api/admin/users")
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatRelativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return "Yesterday"
    if (days < 30) return `${days}d ago`
    return formatDate(iso)
  }

  const isOnline = (iso: string) => {
    return Date.now() - new Date(iso).getTime() < 5 * 60 * 1000
  }

  return (
    <CollapsiblePanel variant="purple" title="Registered Users">
      <div className="flex flex-col gap-2 flex-1">
        {loading && (
          <div className="ch-row px-4 py-3">
            <span className="text-sm text-text-muted">Loading users…</span>
          </div>
        )}
        {error && (
          <div className="ch-row px-4 py-3">
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}
        {!loading && !error && users.length === 0 && (
          <div className="ch-row px-4 py-3">
            <span className="text-sm text-text-muted">No registered users.</span>
          </div>
        )}
        {users.map((u) => (
          <div key={u.id} className="ch-row px-4 py-3 cursor-pointer group">
            <div className="flex items-center gap-2 mb-1">
              {u.privileges === 1 && (
                <span className="badge-admin">Admin</span>
              )}
              {u.gameType && (
                <span className={u.gameType === "RS3" ? "badge-rs3" : "badge-osrs"}>
                  {u.gameType}
                </span>
              )}
              <span className="text-[10px] text-text-muted">
                Joined {formatDate(u.createdAt)}
              </span>
              {u.lastOnline && (
                <span className={`text-[10px] font-semibold ${isOnline(u.lastOnline) ? "text-green-400" : "text-text-muted"}`}>
                  {isOnline(u.lastOnline) ? "Online" : formatRelativeTime(u.lastOnline)}
                </span>
              )}
            </div>
            <div className="text-sm font-medium text-text-highlight group-hover:text-gold transition-colors">
              {u.rsn ?? u.username}
            </div>
            <div className="text-[11px] text-text-muted mt-0.5 leading-relaxed flex flex-wrap gap-x-4">
              {u.rsn && (
                <span>Discord: {u.username}</span>
              )}
              {u.rsnClanName && (
                <span>Clan: <span className="text-gold">{u.rsnClanName}</span></span>
              )}
              {u.rsnLinkedAt && (
                <span>RSN linked {formatDate(u.rsnLinkedAt)}</span>
              )}
              {!u.rsn && (
                <span>No RuneScape account linked</span>
              )}
              {u.lastOnline && (
                <span>Last online: {formatRelativeTime(u.lastOnline)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  )
}
