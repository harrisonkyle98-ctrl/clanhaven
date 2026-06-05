import { useState } from "react"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"

export default function RsnLinkingModal({ onClose }: { onClose?: () => void }) {
  const { refreshUser } = useAuth()
  const [rsn, setRsn] = useState("")
  const [gameType, setGameType] = useState<"RS3" | "OSRS">("RS3")

  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const trimmed = rsn.trim()
    if (!trimmed) {
      setError("Please enter your RuneScape display name.")
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, string> = { rsn: trimmed, gameType }
      await apiFetch("/api/users/me/link-rsn", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      await refreshUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ch-rsn-modal-overlay">
      <div className="ch-rsn-modal">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ch-rsn-modal-close"
            aria-label="Close"
          >
            ×
          </button>
        )}
        <div className="ch-rsn-modal-highlight" />
        <div className="ch-rsn-modal-header">
          <h2 className="ch-rsn-modal-title">Link Your RuneScape Account</h2>
          <p className="ch-rsn-modal-subtitle">
            Connect your RuneScape identity to Clan Haven. Your RuneScape name will become your
            public identity across the platform.
          </p>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e) }} className="ch-rsn-modal-form">
          <div className="ch-rsn-modal-field">
            <label className="ch-rsn-modal-label">RuneScape Display Name</label>
            <input
              type="text"
              value={rsn}
              onChange={(e) => { setRsn(e.target.value) }}
              placeholder="Enter your RSN"
              maxLength={12}
              className="ch-rsn-modal-input"
              autoFocus
              disabled={submitting}
            />
          </div>

          <div className="ch-rsn-modal-field">
            <label className="ch-rsn-modal-label">Game</label>
            <div className="ch-rsn-modal-game-toggle">
              <button
                type="button"
                onClick={() => { setGameType("RS3") }}
                className={`ch-rsn-modal-game-btn ${gameType === "RS3" ? "ch-rsn-modal-game-btn--active" : ""}`}
                disabled={submitting}
              >
                RS3
              </button>
              <button
                type="button"
                onClick={() => { setGameType("OSRS") }}
                className={`ch-rsn-modal-game-btn ${gameType === "OSRS" ? "ch-rsn-modal-game-btn--active" : ""}`}
                disabled={submitting}
              >
                OSRS
              </button>
            </div>
          </div>

          {/* Clan name field hidden — playerDetails.ws auto-discovers clans */}

          {error && <div className="ch-rsn-modal-error">{error}</div>}

          <button
            type="submit"
            disabled={submitting || !rsn.trim()}
            className="ch-rsn-modal-submit"
          >
            {submitting ? "Validating..." : "Link Account"}
          </button>

          <p className="ch-rsn-modal-note">
            Your name will be verified against the RuneScape Hiscores.
          </p>
        </form>
      </div>
    </div>
  )
}
