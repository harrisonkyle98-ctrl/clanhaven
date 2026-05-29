import type { ReactNode } from "react"
import Sidebar from "@/components/Sidebar"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-container relative">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto relative z-1">
        {children}
      </main>
    </div>
  )
}
