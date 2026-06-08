import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          ← Back to Home
        </Link>
      </div>
      {user ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-lg mb-2">
            Welcome, <span className="font-semibold">{user.username}</span>
          </p>
          <p className="text-muted-foreground">
            Your clan dashboard will appear here once you join a clan.
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground">
          Please log in to view your dashboard.
        </p>
      )}
    </div>
  )
}
