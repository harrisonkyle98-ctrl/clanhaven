import { useEffect, useRef, useState, useCallback, type ReactNode } from "react"
import { useLocation } from "react-router-dom"
import Sidebar from "@/components/Sidebar"
import Footer from "@/components/Footer"
import RouteLoadingBar from "@/components/RouteLoadingBar"
import RsnLinkingModal from "@/components/RsnLinkingModal"
import { useAuth } from "@/hooks/useAuth"
import { useHeartbeat } from "@/hooks/useHeartbeat"

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  useEffect(() => {
    const handler = () => { setIsMobile(window.innerWidth < 1024) }
    window.addEventListener("resize", handler)
    return () => { window.removeEventListener("resize", handler) }
  }, [])
  return isMobile
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const { user, loading } = useAuth()
  useHeartbeat(!!user)
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  const needsRsnLink = !loading && user && !user.rsn
  const [rsnModalDismissed, setRsnModalDismissed] = useState(false)

  const closeSidebar = useCallback(() => { setSidebarOpen(false) }, [])

  return (
    <div className="flex h-screen bg-container relative overflow-hidden">
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="ch-sidebar-backdrop"
          onClick={closeSidebar}
        />
      )}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} isMobile={isMobile} />
      <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto relative z-1 transition-all duration-300 ease-in-out">
        <RouteLoadingBar />
        <div className="flex flex-col min-h-full">
          {(!sidebarOpen || isMobile) && (
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
      {needsRsnLink && !rsnModalDismissed && <RsnLinkingModal onClose={() => { setRsnModalDismissed(true) }} />}
    </div>
  )
}
