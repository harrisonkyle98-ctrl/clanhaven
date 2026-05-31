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
    <div className={`ch-panel ch-panel--${variant}`}>
      <div className="ch-panel-header">
        <h2 className="ch-panel-header-title">{title}</h2>
        {headerRight && !collapsed && (
          <div className="ch-panel-header-right">{headerRight}</div>
        )}
        <button
          onClick={() => { setCollapsed(!collapsed) }}
          className={`ch-panel-header-toggle ${!headerRight ? "" : ""}`}
          data-collapsed={collapsed ? "true" : undefined}
          aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          style={!headerRight ? { marginLeft: "auto" } : { marginLeft: 0 }}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
      <div className={`ch-panel-collapse ${collapsed ? "" : "ch-panel-collapse-open"}`}>
        <div className="ch-panel-body">{children}</div>
      </div>
    </div>
  )
}
