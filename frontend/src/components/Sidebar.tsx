import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronDown } from "lucide-react"
import SidebarAccountModule from "@/components/SidebarAccountModule"

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
  const [systemOpen, setSystemOpen] = useState(true)
  const location = useLocation()

  const ribbonClass = "ch-sidebar-ribbon"

  return (
    <aside
      className={`hidden lg:flex shrink-0 h-full sidebar-bg transition-all duration-300 ease-in-out ch-sidebar-width ${open ? "ml-0 opacity-100" : "ch-sidebar-hidden opacity-0 pointer-events-none"}`}
    >
      <div className="flex flex-col h-full w-full">
        {/* Brand + branding image */}
        <div className="ch-sidebar-branding shrink-0">
          <img
            src="/images/sidebar-branding.jpg"
            alt=""
            className="ch-sidebar-branding-img"
          />
          <div className="ch-sidebar-branding-pattern" />
          <div className="ch-sidebar-branding-content">
            <span className="ch-sidebar-branding-title">Clan Haven</span>
          </div>
        </div>

        {/* Main section */}
        <button
          onClick={() => { setMainOpen(!mainOpen) }}
          className={`${ribbonClass} cursor-pointer shrink-0 mb-0.5`}
        >
          <span className="ch-sidebar-ribbon-text">Main</span>
          <ChevronDown className={`ch-sidebar-ribbon-arrow ${mainOpen ? "" : "ch-sidebar-ribbon-arrow--collapsed"}`} />
        </button>
        <div className={`ch-sidebar-section ${mainOpen ? "ch-sidebar-section-open" : ""}`}>
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
        </div>

        {/* System section */}
        <button
          onClick={() => { setSystemOpen(!systemOpen) }}
          className={`${ribbonClass} cursor-pointer shrink-0 mt-1.5 mb-0.5`}
        >
          <span className="ch-sidebar-ribbon-text">System</span>
          <ChevronDown className={`ch-sidebar-ribbon-arrow ${systemOpen ? "" : "ch-sidebar-ribbon-arrow--collapsed"}`} />
        </button>
        <div className={`ch-sidebar-section ${systemOpen ? "ch-sidebar-section-open" : ""}`}>
          <div className="px-2.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              className="ch-sidebar-btn w-full cursor-pointer"
            >
              <span>Collapse</span>
            </button>
          </div>
        </div>

        {/* Account module — pushed to bottom */}
        <SidebarAccountModule />
      </div>
    </aside>
  )
}
