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
  ChevronLeft,
  ChevronRight,
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
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-background">CH</span>
        </div>
        {!collapsed && (
          <span className="text-sm font-bold tracking-wide text-foreground whitespace-nowrap">
            Clan Haven
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => { setMobileOpen(false) }}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors group ${
                isActive
                  ? "bg-gold/10 text-gold border border-gold/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] shrink-0 ${
                isActive ? "text-gold" : "text-muted-foreground group-hover:text-foreground"
              }`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border px-2 py-3 space-y-0.5 shrink-0">
        {user ? (
          <>
            <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
              <div className="w-7 h-7 rounded bg-secondary flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-foreground">
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
              className="flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full cursor-pointer"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>Logout</span>}
            </button>
          </>
        ) : (
          <button
            onClick={() => { login(); setMobileOpen(false) }}
            title={collapsed ? "Login" : undefined}
            className="flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-muted-foreground hover:text-gold hover:bg-gold/5 transition-colors w-full cursor-pointer"
          >
            <LogIn className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Login with Discord</span>}
          </button>
        )}

        <Link
          to="/dashboard"
          onClick={() => { setMobileOpen(false) }}
          title={collapsed ? "Settings" : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
            location.pathname === "/dashboard"
              ? "bg-gold/10 text-gold border border-gold/20"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
          }`}
        >
          <Settings className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={() => { setCollapsed(!collapsed) }}
        className="hidden lg:flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => { setMobileOpen(!mobileOpen) }}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded bg-panel border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => { setMobileOpen(false) }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen
          bg-sidebar border-r border-border
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
