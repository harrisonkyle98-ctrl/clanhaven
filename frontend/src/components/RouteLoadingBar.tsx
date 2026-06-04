import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"

export default function RouteLoadingBar() {
  const location = useLocation()
  const [state, setState] = useState<"idle" | "loading" | "completing">("idle")
  const [progress, setProgress] = useState(0)
  const prevPath = useRef(location.pathname)
  const rafRef = useRef(0)

  useEffect(() => {
    if (location.pathname === prevPath.current) return
    prevPath.current = location.pathname

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
        className={`ch-loading-bar ${state === "completing" ? "ch-loading-bar--complete" : ""}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
