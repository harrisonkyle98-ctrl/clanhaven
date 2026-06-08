import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold mb-2">404</h1>
      <p className="text-muted-foreground text-lg mb-6">Page not found.</p>
      <Link
        to="/"
        className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
      >
        Go Home
      </Link>
    </div>
  )
}
