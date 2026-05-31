import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import {
  ChevronDown,
  PanelLeftClose,
} from "lucide-react"

const mainNavItems = [
  { label: "Home", to: "/" },
  { label: "Clans", to: "/clans" },
  { label: "Rankings", to: "/rankings" },
  { label: "Competitions", to: "/competitions" },
  { label: "Players", to: "/players" },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [mainOpen, setMainOpen] = useState(true)
  const [accountOpen, setAccountOpen] = useState(true)
  const [systemOpen, setSystemOpen] = useState(true)
  const location = useLocation()
  const { user, login, logout } = useAuth()

  const ribbonClass = "ch-sidebar-ribbon"

  return (
    <aside
      className={`hidden lg:flex shrink-0 h-full sidebar-bg transition-all duration-300 ease-in-out w-[220px] ${open ? "ml-0 opacity-100" : "-ml-[220px] opacity-0 pointer-events-none"}`}
    >
      <div className="flex flex-col h-full w-full">
        {/* Brand */}
        <div className="px-4 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-background tracking-tight">CH</span>
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide text-text-highlight">Clan Haven</div>
              <div className="text-[10px] text-gold-dim font-medium tracking-wider uppercase">Community Hub</div>
            </div>
          </div>
        </div>

        {/* Main section */}
        <button
          onClick={() => { setMainOpen(!mainOpen) }}
          className={`${ribbonClass} cursor-pointer shrink-0 mt-1.5 mb-0.5`}
        >
          <span className="relative flex items-center justify-center w-full">
            Main
            <ChevronDown className={`absolute right-0 w-3 h-3 opacity-60 transition-transform duration-200 ${mainOpen ? "" : "-rotate-90"}`} />
          </span>
        </button>
        {mainOpen && (
          <div className="px-2.5 space-y-1.5 shrink-0">
            {mainNavItems.map((item) => {
              const isActive = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`ch-sidebar-btn ${isActive ? "ch-sidebar-btn-active" : ""}`}
                >
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        )}

        {/* Account section */}
        <button
          onClick={() => { setAccountOpen(!accountOpen) }}
          className={`${ribbonClass} cursor-pointer shrink-0 mt-1.5 mb-0.5`}
        >
          <span className="relative flex items-center justify-center w-full">
            Account
            <ChevronDown className={`absolute right-0 w-3 h-3 opacity-60 transition-transform duration-200 ${accountOpen ? "" : "-rotate-90"}`} />
          </span>
        </button>
        {accountOpen && (
          <div className="px-2.5 space-y-1.5 shrink-0">
            {user ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); logout() }}
                  className="ch-sidebar-btn w-full cursor-pointer"
                >
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); login() }}
                className="ch-sidebar-btn w-full cursor-pointer"
              >
                <span>Login with Discord</span>
              </button>
            )}

            <Link
              to="/dashboard"
              className={`ch-sidebar-btn ${location.pathname === "/dashboard" ? "ch-sidebar-btn-active" : ""}`}
            >
              <span>Settings</span>
            </Link>
          </div>
        )}

        {/* System section */}
        <button
          onClick={() => { setSystemOpen(!systemOpen) }}
          className={`${ribbonClass} cursor-pointer shrink-0 mt-1.5 mb-0.5`}
        >
          <span className="relative flex items-center justify-center w-full">
            System
            <ChevronDown className={`absolute right-0 w-3 h-3 opacity-60 transition-transform duration-200 ${systemOpen ? "" : "-rotate-90"}`} />
          </span>
        </button>
        {systemOpen && (
          <div className="px-2.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              className="ch-sidebar-btn w-full cursor-pointer"
            >
              <PanelLeftClose className="w-3.5 h-3.5 opacity-70" />
              <span>Collapse</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
