import { Link } from "react-router-dom"

const platformLinks = [
  { label: "Home", to: "/" },
  { label: "Clans", to: "/clans" },
  { label: "Rankings", to: "/clans" },
  { label: "Competitions", to: "/clans" },
  { label: "Players", to: "/clans" },
]

const resourceLinks = [
  { label: "About", to: "/" },
  { label: "API Docs", to: "/" },
  { label: "Discord", to: "/" },
  { label: "GitHub", to: "/" },
]

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-8">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="text-lg font-bold tracking-tight mb-2">Clan Haven</div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The home for RuneScape clans. Track XP, host competitions, and
              grow your community.
            </p>
          </div>

          {/* Platform */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Platform
            </div>
            <ul className="space-y-2">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Resources
            </div>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Clan Haven is not affiliated with Jagex Ltd.
          </p>
          <p className="text-xs text-muted-foreground">
            RuneScape is a registered trademark of Jagex Ltd.
          </p>
        </div>
      </div>
    </footer>
  )
}
