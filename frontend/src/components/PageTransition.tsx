import { useEffect, useRef, useState, type ReactNode } from "react"
import { useLocation } from "react-router-dom"

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitioning, setTransitioning] = useState(false)
  const prevPath = useRef(location.pathname)

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname
      setTransitioning(true)
      const timer = setTimeout(() => {
        setDisplayChildren(children)
        setTransitioning(false)
      }, 150)
      return () => clearTimeout(timer)
    } else {
      setDisplayChildren(children)
    }
  }, [location.pathname, children])

  return (
    <div
      className={`ch-page-transition ${transitioning ? "ch-page-transition--out" : "ch-page-transition--in"}`}
    >
      {displayChildren}
    </div>
  )
}
