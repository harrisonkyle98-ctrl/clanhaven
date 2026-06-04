import { useState, useCallback, type ReactNode } from "react"
import { apiFetch } from "@/lib/api"
import { AuthContext, type User } from "./auth-context"

function getInitialToken(): string | null {
  const params = new URLSearchParams(window.location.search)
  const urlToken = params.get("token")
  if (urlToken) {
    localStorage.setItem("access_token", urlToken)
    window.history.replaceState({}, "", window.location.pathname)
    return urlToken
  }
  return localStorage.getItem("access_token")
}

const initialToken = getInitialToken()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(!!initialToken)

  const fetchUser = useCallback(async () => {
    try {
      const data = await apiFetch<User>("/api/users/me")
      setUser(data)
    } catch {
      localStorage.removeItem("access_token")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Trigger initial fetch if token exists
  if (loading && !user) {
    void fetchUser()
  }

  const login = useCallback(async () => {
    const data = await apiFetch<{ auth_url: string }>("/api/auth/discord")
    window.location.href = data.auth_url
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("access_token")
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<User>("/api/users/me")
      setUser(data)
    } catch {
      // ignore refresh errors
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
