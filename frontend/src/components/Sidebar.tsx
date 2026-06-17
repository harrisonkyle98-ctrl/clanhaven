import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { ChevronDown, ChevronLeft } from "lucide-react"
import ClanHavenLogo from "@/components/ClanHavenLogo"
import SidebarAccountModule from "@/components/SidebarAccountModule"

const mainNavItems = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "FAQ", to: "/faq" },
  { label: "Features", to: "/features" },
]

const clansNavItems = [
  { label: "Clan Directory", to: "/clan-directory" },
  { label: "CvC Competitions", to: "/competitions" },
  { label: "Clan Tools", to: "/clan-tools" },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  isMobile?: boolean
}

export default function Sidebar({ open, onClose, isMobile }: SidebarProps) {
  const [mainOpen, setMainOpen] = useState(true)
  const [clansOpen, setClansOpen] = useState(true)
  const location = useLocation()

  const ribbonClass = "ch-sidebar-ribbon"

  return (
    <aside
      className={`${isMobile ? "ch-sidebar-mobile" : "hidden lg:flex"} shrink-0 h-full sidebar-bg transition-all duration-300 ease-in-out ch-sidebar-width ${open ? "ml-0 opacity-100" : "ch-sidebar-hidden opacity-0 pointer-events-none"}`}
    >
      <div className="flex flex-col h-full w-full">
        {/* Brand + branding image with collapse arrow */}
        <div className="ch-sidebar-branding shrink-0">
          <img
            src="/images/sidebar-branding.jpg"
            alt=""
            className="ch-sidebar-branding-img"
          />
          <div className="ch-sidebar-branding-pattern" />
          <div className="ch-sidebar-branding-content">
            <ClanHavenLogo size={36} className="ch-sidebar-logo" />
            <span className="ch-sidebar-branding-title">Clan Haven</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="ch-sidebar-collapse-arrow"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
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

        {/* Clans section */}
        <button
          onClick={() => { setClansOpen(!clansOpen) }}
          className={`${ribbonClass} cursor-pointer shrink-0 mt-1.5 mb-0.5`}
        >
          <span className="ch-sidebar-ribbon-text">Clans</span>
          <ChevronDown className={`ch-sidebar-ribbon-arrow ${clansOpen ? "" : "ch-sidebar-ribbon-arrow--collapsed"}`} />
        </button>
        <div className={`ch-sidebar-section ${clansOpen ? "ch-sidebar-section-open" : ""}`}>
          <div className="px-2.5 space-y-1.5 shrink-0">
            {clansNavItems.map((item) => {
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

        {/* Account module — pushed to bottom */}
        <SidebarAccountModule />
      </div>
    </aside>
  )
}
