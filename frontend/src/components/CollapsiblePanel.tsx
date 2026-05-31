import { useState, type ReactNode } from "react"
import { ChevronUp } from "lucide-react"

interface CollapsiblePanelProps {
  variant: "gold" | "blue" | "purple" | "green" | "amber" | "red"
  title: string
  headerRight?: ReactNode
  children: ReactNode
  defaultCollapsed?: boolean
}

export default function CollapsiblePanel({
  variant,
  title,
  headerRight,
  children,
  defaultCollapsed = false,
}: CollapsiblePanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <div className={`ch-panel ch-panel--${variant}${collapsed ? " ch-panel--collapsed" : ""}`}>
      <div
        className="ch-panel-header cursor-pointer"
        onClick={() => { setCollapsed(!collapsed) }}
        role="button"
        aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
      >
        <h2 className="ch-panel-header-title">{title}</h2>
        {headerRight && (
          <div
            className="ch-panel-header-right"
            style={collapsed ? { visibility: "hidden", pointerEvents: "none" } : undefined}
            onClick={(e) => { e.stopPropagation() }}
          >
            {headerRight}
          </div>
        )}
        <div
          className="ch-panel-header-toggle"
          data-collapsed={collapsed ? "true" : undefined}
          style={!headerRight ? { marginLeft: "auto" } : { marginLeft: 0 }}
        >
          <ChevronUp className="w-4 h-4" />
        </div>
      </div>
      <div className={`ch-panel-collapse ${collapsed ? "" : "ch-panel-collapse-open"}`}>
        <div className="ch-panel-collapse-inner">
          <div className="ch-panel-body">{children}</div>
        </div>
      </div>
    </div>
  )
}
