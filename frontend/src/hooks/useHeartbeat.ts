import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { apiFetch } from "@/lib/api"

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000 // 2 minutes

export function useHeartbeat(isLoggedIn: boolean) {
  const lastSent = useRef(0)
  const location = useLocation()

  useEffect(() => {
    if (!isLoggedIn) return

    const send = () => {
      const now = Date.now()
      if (now - lastSent.current < HEARTBEAT_INTERVAL_MS) return
      lastSent.current = now
      void apiFetch("/api/users/me/heartbeat", { method: "POST" }).catch(() => {})
    }

    send()

    const interval = setInterval(send, HEARTBEAT_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isLoggedIn, location.pathname])
}
