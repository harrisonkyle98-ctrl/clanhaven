import { Link } from "react-router-dom"

export default function Clans() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Clans</h1>
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          ← Back to Home
        </Link>
      </div>
      <p className="text-muted-foreground">
        Clan directory coming soon. This page will list all public clans on the
        platform.
      </p>
    </div>
  )
}
