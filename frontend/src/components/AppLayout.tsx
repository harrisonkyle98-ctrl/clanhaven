import { useState, type ReactNode } from "react"
import Sidebar from "@/components/Sidebar"
import { PanelLeftOpen } from "lucide-react"

export default function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-container relative overflow-hidden">
      {sidebarOpen && <Sidebar onClose={() => { setSidebarOpen(false) }} />}
      <main className="flex-1 min-w-0 overflow-y-auto relative z-1">
        {!sidebarOpen && (
          <button
            onClick={() => { setSidebarOpen(true) }}
            className="ch-sidebar-open-btn"
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
            <span>Menu</span>
          </button>
        )}
        {children}
      </main>
    </div>
  )
}
