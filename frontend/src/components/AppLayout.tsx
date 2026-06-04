import { useEffect, useRef, useState, type ReactNode } from "react"
import { useLocation } from "react-router-dom"
import Sidebar from "@/components/Sidebar"
import Footer from "@/components/Footer"
import RouteLoadingBar from "@/components/RouteLoadingBar"
import RsnLinkingModal from "@/components/RsnLinkingModal"
import { useAuth } from "@/hooks/useAuth"
import { useHeartbeat } from "@/hooks/useHeartbeat"

export default function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, loading } = useAuth()
  useHeartbeat(!!user)
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  const needsRsnLink = !loading && user && !user.rsn

  return (
    <div className="flex h-screen bg-container relative overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => { setSidebarOpen(false) }} />
      <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto relative z-1 transition-all duration-300 ease-in-out">
        <RouteLoadingBar />
        <div className="flex flex-col min-h-full">
          {!sidebarOpen && (
            <button
              onClick={() => { setSidebarOpen(true) }}
              className="ch-sidebar-open-btn"
              aria-label="Open sidebar"
            >
              <span>Menu</span>
            </button>
          )}
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </div>
      </main>
      {needsRsnLink && <RsnLinkingModal />}
    </div>
  )
}
