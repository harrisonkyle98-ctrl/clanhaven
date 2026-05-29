import type { ReactNode } from "react"
import Sidebar from "@/components/Sidebar"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-container relative overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto relative z-1">
        {children}
      </main>
    </div>
  )
}
