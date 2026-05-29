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
  Menu,
  X,
} from "lucide-react"

const navItems = [
  { icon: Home, label: "Home", to: "/" },
  { icon: Shield, label: "Clans", to: "/clans" },
  { icon: Trophy, label: "Rankings", to: "/rankings" },
  { icon: Swords, label: "Competitions", to: "/competitions" },
  { icon: Users, label: "Players", to: "/players" },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { user, login, logout } = useAuth()

  const sidebarContent = (
    <div className="flex flex-col h-full">
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

      <div className="divider-subtle mx-3" />

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
        <div className={`text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2 ${collapsed ? "text-center" : "px-3"}`}>
          {collapsed ? "•" : "Navigate"}
        </div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => { setMobileOpen(false) }}
              title={collapsed ? item.label : undefined}
              className={`ch-nav-item ${isActive ? "ch-nav-item-active" : ""} ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "opacity-100" : "opacity-70"}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2.5 pb-3 space-y-1 shrink-0">
        <div className="divider-subtle mx-1 mb-3" />

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
              onClick={() => { logout(); setMobileOpen(false) }}
              title={collapsed ? "Logout" : undefined}
              className="ch-nav-item w-full cursor-pointer"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0 opacity-70" />
              {!collapsed && <span>Logout</span>}
            </button>
          </>
        ) : (
          <button
            onClick={() => { login(); setMobileOpen(false) }}
            title={collapsed ? "Login" : undefined}
            className="ch-nav-item w-full cursor-pointer"
          >
            <LogIn className="w-[18px] h-[18px] shrink-0 opacity-70" />
            {!collapsed && <span>Login with Discord</span>}
          </button>
        )}

        <Link
          to="/dashboard"
          onClick={() => { setMobileOpen(false) }}
          title={collapsed ? "Settings" : undefined}
          className={`ch-nav-item ${location.pathname === "/dashboard" ? "ch-nav-item-active" : ""} ${collapsed ? "justify-center" : ""}`}
        >
          <Settings className={`w-[18px] h-[18px] shrink-0 ${location.pathname === "/dashboard" ? "opacity-100" : "opacity-70"}`} />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => { setCollapsed(!collapsed) }}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden lg:flex items-center justify-center gap-2 h-11 border-t border-border text-text-muted hover:text-text-highlight transition-colors cursor-pointer"
      >
        {collapsed ? (
          <PanelLeftOpen className="w-4 h-4" />
        ) : (
          <>
            <PanelLeftClose className="w-4 h-4" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Collapse</span>
          </>
        )}
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => { setMobileOpen(!mobileOpen) }}
        className="lg:hidden fixed top-3 left-3 z-50 ch-nav-item cursor-pointer"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70"
          onClick={() => { setMobileOpen(false) }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen
          sidebar-bg
          transition-all duration-200 ease-in-out
          ${collapsed ? "w-[60px]" : "w-[220px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
