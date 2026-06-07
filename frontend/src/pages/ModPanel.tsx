import { useState } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
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
              <span className="ch-admin-status-value">0</span>
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

function ModAltAccountsTab() {
  return (
    <div className="space-y-4">
      <CollapsiblePanel variant="green" title="Alt Account Requests">
        <div className="ch-admin-section">
          <p className="ch-admin-placeholder">
            This section will allow moderators to review alt account linking requests.
            Players who want to link multiple RuneScape accounts to a single Clan Haven
            profile will submit requests here for moderator review.
          </p>
          <div className="ch-admin-status-row" style={{ marginTop: "1rem" }}>
            <span className="ch-admin-status-label">Pending Requests</span>
            <span className="ch-admin-status-value">0</span>
          </div>
          <p className="ch-admin-placeholder" style={{ marginTop: "0.75rem", fontSize: "0.625rem" }}>
            Moderators will be able to: view the requesting player's main account details,
            verify the alt account belongs to the same person, approve or deny the link request,
            and add notes to the decision.
          </p>
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
