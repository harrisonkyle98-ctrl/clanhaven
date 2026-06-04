import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import CollapsiblePanel from "@/components/CollapsiblePanel"
import { Shield, Home, Newspaper, Users, Swords, Settings, FileText } from "lucide-react"

const TABS = [
  { id: "home", label: "Home", icon: Home },
] as const

const FUTURE_TABS = [
  { label: "News", icon: Newspaper },
  { label: "Users", icon: Users },
  { label: "Clans", icon: Swords },
  { label: "Site Settings", icon: Settings },
  { label: "Content", icon: FileText },
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
            <Shield className="inline-block w-6 h-6 mr-2 align-text-bottom" />
            Admin Panel
          </h1>
        </div>
      </div>

      <div className="ch-page-content p-4 lg:p-6 space-y-4">
        <Link
          to="/"
          className="ch-admin-back-link"
        >
          ← Back to Home
        </Link>

        {/* Tab navigation */}
        <div className="ch-admin-tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`ch-admin-tab${activeTab === tab.id ? " ch-admin-tab--active" : ""}`}
                onClick={() => { setActiveTab(tab.id) }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
          {FUTURE_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.label}
                className="ch-admin-tab ch-admin-tab--disabled"
                disabled
                title="Coming soon"
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {activeTab === "home" && <AdminHomeTab username={user.rsn ?? user.username} />}
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
