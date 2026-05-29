import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Menu, X } from "lucide-react"

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Clans", to: "/clans" },
  { label: "Rankings", to: "/clans" },
  { label: "Competitions", to: "/clans" },
  { label: "Players", to: "/clans" },
]

export default function Navbar() {
  const { user, login, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Brand + Links */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xs font-bold text-white">
              CH
            </div>
            <span className="text-lg font-bold tracking-tight">Clan Haven</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === "/dashboard"
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Right: Auth + Mobile toggle */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.username}
              </span>
              <button
                onClick={logout}
                className="text-sm text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => { login() }}
              className="hidden md:block text-sm px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition cursor-pointer"
            >
              Login
            </button>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => { setMobileOpen(!mobileOpen) }}
            className="md:hidden p-1.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => { setMobileOpen(false) }}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => { setMobileOpen(false) }}
                className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={() => { logout(); setMobileOpen(false) }}
                className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => { login(); setMobileOpen(false) }}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-indigo-400 hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              Login with Discord
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
