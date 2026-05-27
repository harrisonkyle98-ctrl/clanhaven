import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

export default function Navbar() {
  const { user, login, logout } = useAuth()

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-bold tracking-tight">
            Clan Haven
          </Link>
          <Link
            to="/clans"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Clans
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              Dashboard
            </Link>
          )}
        </div>

        <div>
          {user ? (
            <div className="flex items-center gap-4">
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
              className="text-sm px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition cursor-pointer"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
