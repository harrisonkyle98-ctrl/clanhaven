import { useState, type ReactNode } from "react"
import Sidebar from "@/components/Sidebar"
import Footer from "@/components/Footer"

export default function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-container relative overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => { setSidebarOpen(false) }} />
      <main className="flex-1 min-w-0 overflow-y-auto relative z-1 transition-all duration-300 ease-in-out">
        {!sidebarOpen && (
          <button
            onClick={() => { setSidebarOpen(true) }}
            className="ch-sidebar-open-btn"
            aria-label="Open sidebar"
          >
            <span>Menu</span>
          </button>
        )}
        {children}
        <Footer />
      </main>
    </div>
  )
}
