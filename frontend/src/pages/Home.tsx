import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

export default function Home() {
  const { user, login } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-5xl font-bold mb-4 tracking-tight">Clan Haven</h1>
      <p className="text-muted-foreground text-lg max-w-xl mb-8">
        A multi-clan platform for RuneScape communities. Track XP, host
        competitions, and manage your clan — all in one place.
      </p>

      <div className="flex gap-4">
        {user ? (
          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            Go to Dashboard
          </Link>
        ) : (
          <button
            onClick={() => { login() }}
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition cursor-pointer"
          >
            Login with Discord
          </button>
        )}
        <Link
          to="/clans"
          className="px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-secondary transition"
        >
          Browse Clans
        </Link>
      </div>
    </div>
  )
}
