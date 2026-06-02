import { useState } from "react"

/**
 * Visual-only sidebar account module.
 * Toggles between mock logged-out and logged-in states for design exploration.
 * No real auth/backend logic — purely presentational.
 */
export default function SidebarAccountModule() {
  const [mockLoggedIn, setMockLoggedIn] = useState(false)

  return (
    <div className="ch-sidebar-account">
      {mockLoggedIn ? (
        /* ── Logged-in state ── */
        <div className="ch-sidebar-account-card">
          <div className="ch-sidebar-account-card-highlight" />
          <div className="ch-sidebar-account-user">
            <div className="ch-sidebar-account-avatar">
              <span className="ch-sidebar-account-avatar-text">KH</span>
              <span className="ch-sidebar-account-status" />
            </div>
            <div className="ch-sidebar-account-info">
              <span className="ch-sidebar-account-name">KingdomHero</span>
              <span className="ch-sidebar-account-role">Clan Owner</span>
            </div>
          </div>

          <div className="ch-sidebar-account-divider" />

          <div className="ch-sidebar-account-actions">
            <button className="ch-sidebar-account-action">
              <span>My Profile</span>
            </button>
            <button className="ch-sidebar-account-action">
              <span>My Clan</span>
            </button>
            <button className="ch-sidebar-account-action">
              <span>Settings</span>
            </button>
            <button className="ch-sidebar-account-action">
              <span>Badges</span>
            </button>
          </div>

          <button
            onClick={() => setMockLoggedIn(false)}
            className="ch-sidebar-account-action ch-sidebar-account-action--signout"
          >
            <span>Sign Out</span>
          </button>
        </div>
      ) : (
        /* ── Logged-out state ── */
        <div className="ch-sidebar-account-card">
          <div className="ch-sidebar-account-card-highlight" />
          <div className="ch-sidebar-account-guest">
            <div className="ch-sidebar-account-avatar ch-sidebar-account-avatar--guest">
              <span className="ch-sidebar-account-avatar-text">?</span>
            </div>
            <span className="ch-sidebar-account-guest-label">Welcome, Scaper</span>
            <span className="ch-sidebar-account-guest-sub">
              Connect your Discord to Clan Haven
            </span>
          </div>

          <button
            onClick={() => setMockLoggedIn(true)}
            className="ch-sidebar-account-discord-btn"
          >
            <svg className="ch-sidebar-account-discord-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
            </svg>
            <span>Login with Discord</span>
          </button>
        </div>
      )}
    </div>
  )
}
