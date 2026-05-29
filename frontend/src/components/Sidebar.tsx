import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import {
  Home,
  Shield,
  Trophy,
  Swords,
  Users,
  Settings,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

const mainNavItems = [
  { icon: Home, label: "Home", to: "/" },
  { icon: Shield, label: "Clans", to: "/clans" },
  { icon: Trophy, label: "Rankings", to: "/rankings" },
  { icon: Swords, label: "Competitions", to: "/competitions" },
  { icon: Users, label: "Players", to: "/players" },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { user, login, logout } = useAuth()

  const ribbonClass = collapsed
    ? "ch-sidebar-ribbon ch-sidebar-ribbon--collapsed"
    : "ch-sidebar-ribbon"

  return (
    <aside
      className={`
        hidden lg:flex sticky top-0 left-0 h-screen
        sidebar-bg
        transition-all duration-200 ease-in-out
        ${collapsed ? "w-[60px]" : "w-[220px]"}
      `}
    >
      <div className="flex flex-col h-full w-full">
        {/* Brand */}
        <div className="px-4 pt-5 pb-4 shrink-0">
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <div className="w-9 h-9 rounded-sm bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-background tracking-tight">CH</span>
            </div>
            {!collapsed && (
              <div>
                <div className="text-sm font-bold tracking-wide text-text-highlight">Clan Haven</div>
                <div className="text-[10px] text-gold-dim font-medium tracking-wider uppercase">Community Hub</div>
              </div>
            )}
          </div>
        </div>

        {/* Main section */}
        <div className={ribbonClass}>{collapsed ? "" : "Main"}</div>
        <nav className="flex-1 py-2 px-2.5 space-y-1 overflow-y-auto shrink min-h-0">
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`ch-nav-item ${isActive ? "ch-nav-item-active" : ""} ${collapsed ? "justify-center" : ""}`}
              >
                <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "opacity-100" : "opacity-70"}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Account section */}
        <div className={`shrink-0 ${ribbonClass}`}>{collapsed ? "" : "Account"}</div>
        <div className="py-2 px-2.5 space-y-1 shrink-0">
          {user ? (
            <>
              <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
                <div className="w-7 h-7 rounded-sm bg-gradient-to-br from-secondary to-muted flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-text-highlight">
                    {user.username[0]?.toUpperCase()}
                  </span>
                </div>
                {!collapsed && (
                  <span className="text-sm text-foreground truncate">{user.username}</span>
                )}
              </div>
              <button
                onClick={() => { logout() }}
                title={collapsed ? "Logout" : undefined}
                className="ch-nav-item w-full cursor-pointer"
              >
                <LogOut className="w-[18px] h-[18px] shrink-0 opacity-70" />
                {!collapsed && <span>Logout</span>}
              </button>
            </>
          ) : (
            <button
              onClick={() => { login() }}
              title={collapsed ? "Login" : undefined}
              className="ch-nav-item w-full cursor-pointer"
            >
              <LogIn className="w-[18px] h-[18px] shrink-0 opacity-70" />
              {!collapsed && <span>Login with Discord</span>}
            </button>
          )}

          <Link
            to="/dashboard"
            title={collapsed ? "Settings" : undefined}
            className={`ch-nav-item ${location.pathname === "/dashboard" ? "ch-nav-item-active" : ""} ${collapsed ? "justify-center" : ""}`}
          >
            <Settings className={`w-[18px] h-[18px] shrink-0 ${location.pathname === "/dashboard" ? "opacity-100" : "opacity-70"}`} />
            {!collapsed && <span>Settings</span>}
          </Link>
        </div>

        {/* System section */}
        <div className={`shrink-0 ${ribbonClass}`}>{collapsed ? "" : "System"}</div>
        <div className="py-2 px-2.5 shrink-0">
          <button
            onClick={() => { setCollapsed(!collapsed) }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="ch-nav-item w-full cursor-pointer"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-[18px] h-[18px] shrink-0 opacity-70" />
            ) : (
              <>
                <PanelLeftClose className="w-[18px] h-[18px] shrink-0 opacity-70" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
