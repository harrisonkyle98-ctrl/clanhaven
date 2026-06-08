import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"

export default function RouteLoadingBar() {
  const location = useLocation()
  const [state, setState] = useState<"idle" | "loading" | "completing">("idle")
  const [progress, setProgress] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMod, setIsMod] = useState(false)
  const [isSettings, setIsSettings] = useState(false)
  const prevPath = useRef(location.pathname)
  const rafRef = useRef(0)

  useEffect(() => {
    if (location.pathname === prevPath.current) return
    prevPath.current = location.pathname

    setIsAdmin(location.pathname.startsWith("/admin"))
    setIsMod(location.pathname.startsWith("/mod"))
    setIsSettings(location.pathname.startsWith("/settings"))
    setState("loading")
    setProgress(0)

    let current = 0
    const tick = () => {
      current += (90 - current) * 0.1
      setProgress(current)
      if (current < 88) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    const completeTimer = setTimeout(() => {
      cancelAnimationFrame(rafRef.current)
      setProgress(100)
      setState("completing")
      setTimeout(() => {
        setState("idle")
        setProgress(0)
      }, 300)
    }, 200)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(completeTimer)
    }
  }, [location.pathname])

  if (state === "idle") return null

  return (
    <div className="ch-loading-bar-track">
      <div
        className={`ch-loading-bar${isAdmin ? " ch-loading-bar--purple" : ""}${isMod ? " ch-loading-bar--green" : ""}${isSettings ? " ch-loading-bar--blue" : ""}${state === "completing" ? " ch-loading-bar--complete" : ""}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
