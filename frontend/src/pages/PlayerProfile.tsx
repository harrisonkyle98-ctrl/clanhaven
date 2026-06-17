import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { apiFetch } from "@/lib/api"

interface PlayerData {
  id: string
  rsn: string
  normalizedRsn: string
  accountType: string
  totalLevel: number
  totalXp: number
  combatLevel: number
  currentClanId: string | null
  currentClanName: string | null
}

interface ClanInfo {
  id: string
  name: string
  slug: string
  rank: string | null
}

interface Skill {
  name: string
  level: number
  xp: number
}

interface PlayerProfileResponse {
  player: PlayerData
  clan: ClanInfo | null
  skills: Skill[]
  snapshotCount: number
  hasHistory: boolean
}

interface GainsData {
  daily: { totalXp: number; totalLevel: number; period: string } | null
  weekly: { totalXp: number; totalLevel: number; period: string } | null
  monthly: { totalXp: number; totalLevel: number; period: string } | null
  message?: string
}

interface ActivityEvent {
  id: string
  eventType: string
  metadata: Record<string, unknown>
  occurredAt: string
}

function formatXp(xp: number): string {
  if (xp >= 1_000_000_000) return `${(xp / 1_000_000_000).toFixed(1)}B`
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`
  return xp.toLocaleString()
}

function formatGain(xp: number): string {
  if (xp === 0) return "—"
  const prefix = xp > 0 ? "+" : ""
  if (Math.abs(xp) >= 1_000_000) return `${prefix}${(xp / 1_000_000).toFixed(1)}M`
  if (Math.abs(xp) >= 1_000) return `${prefix}${(xp / 1_000).toFixed(1)}K`
  return `${prefix}${xp.toLocaleString()}`
}

function getAccountTypeLabel(type: string): string | null {
  switch (type) {
    case "ironman": return "Ironman"
    case "hardcore_ironman": return "Hardcore Ironman"
    case "group_ironman": return "Group Ironman"
    default: return null
  }
}

function getSkillDisplayName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export default function PlayerProfile() {
  const { rsn } = useParams<{ rsn: string }>()
  const [data, setData] = useState<PlayerProfileResponse | null>(null)
  const [gains, setGains] = useState<GainsData | null>(null)
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!rsn) return
    setLoading(true)
    setError(null)

    const fetchProfile = async () => {
      try {
        const res = await apiFetch<PlayerProfileResponse>(`/api/players/profile/${rsn}`)
        setData(res)

        // Fetch gains and activity in parallel
        const [gainsRes, activityRes] = await Promise.allSettled([
          apiFetch<GainsData>(`/api/players/profile/${rsn}/gains`),
          apiFetch<{ events: ActivityEvent[] }>(`/api/players/profile/${rsn}/activity`),
        ])

        if (gainsRes.status === "fulfilled") setGains(gainsRes.value)
        if (activityRes.status === "fulfilled") setActivity(activityRes.value.events)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load player profile")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [rsn])

  if (loading) {
    return (
      <div>
        <div className="ch-page-banner">
          <img src="/images/home-banner.jpg" alt="" className="ch-page-banner-img" />
          <div className="ch-page-banner-content">
            <h1 className="ch-page-banner-title">Loading...</h1>
          </div>
        </div>
        <div className="ch-page-content p-4 lg:p-6">
          <div className="ch-clan-loading">Loading player profile...</div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        <div className="ch-page-banner">
          <img src="/images/home-banner.jpg" alt="" className="ch-page-banner-img" />
          <div className="ch-page-banner-content">
            <h1 className="ch-page-banner-title">Player Not Found</h1>
          </div>
        </div>
        <div className="ch-page-content p-4 lg:p-6">
          <div className="ch-clan-error">
            <p>{error || "This player could not be found."}</p>
            <Link to="/clan-directory" className="ch-clan-back-link">← Back to Clan Directory</Link>
          </div>
        </div>
      </div>
    )
  }

  const { player, clan, skills } = data
  const accountLabel = getAccountTypeLabel(player.accountType)

  return (
    <div>
      {/* Banner */}
      <div className="ch-page-banner">
        <img src="/images/home-banner.jpg" alt={`${player.rsn} profile`} className="ch-page-banner-img" />
        <div className="ch-page-banner-content">
          <h1 className="ch-page-banner-title">{player.rsn}</h1>
        </div>
      </div>

      <div className="ch-page-content p-4 lg:p-6 space-y-4">
        {/* Back link */}
        <Link to="/clan-directory" className="ch-clan-back-link">← Back to Clan Directory</Link>

        {/* Player Header */}
        <div className="ch-stat-cell ch-player-header">
          <div className="ch-player-header-info">
            <h2 className="ch-player-name">{player.rsn}</h2>
            <div className="ch-player-tags">
              <span className="ch-player-tag ch-player-tag--rs3">RS3</span>
              {accountLabel && (
                <span className="ch-player-tag ch-player-tag--ironman">{accountLabel}</span>
              )}
            </div>
            {clan && (
              <div className="ch-player-clan-info">
                <Link to={`/${clan.slug}`} className="ch-player-clan-link">
                  {clan.name}
                </Link>
                {clan.rank && <span className="ch-player-clan-rank">({clan.rank})</span>}
              </div>
            )}
          </div>
        </div>

        {/* Current Stats */}
        <div className="ch-player-stats-row">
          <div className="ch-stat-cell ch-player-stat-box">
            <span className="ch-discovery-stat-label">Total XP</span>
            <span className="ch-discovery-stat-value ch-xp-green">{formatXp(player.totalXp)}</span>
          </div>
          <div className="ch-stat-cell ch-player-stat-box">
            <span className="ch-discovery-stat-label">Total Level</span>
            <span className="ch-discovery-stat-value">{player.totalLevel.toLocaleString()}</span>
          </div>
          <div className="ch-stat-cell ch-player-stat-box">
            <span className="ch-discovery-stat-label">Combat Level</span>
            <span className="ch-discovery-stat-value">{player.combatLevel}</span>
          </div>
        </div>

        {/* XP Gains */}
        {gains && !gains.message && (
          <div className="ch-player-gains-section">
            <h3 className="ch-player-section-title">XP Gains</h3>
            <div className="ch-player-stats-row">
              {gains.daily && (
                <div className="ch-stat-cell ch-player-stat-box">
                  <span className="ch-discovery-stat-label">Daily</span>
                  <span className="ch-discovery-stat-value ch-xp-green">{formatGain(gains.daily.totalXp)}</span>
                </div>
              )}
              {gains.weekly && (
                <div className="ch-stat-cell ch-player-stat-box">
                  <span className="ch-discovery-stat-label">Weekly</span>
                  <span className="ch-discovery-stat-value ch-xp-green">{formatGain(gains.weekly.totalXp)}</span>
                </div>
              )}
              {gains.monthly && (
                <div className="ch-stat-cell ch-player-stat-box">
                  <span className="ch-discovery-stat-label">Monthly</span>
                  <span className="ch-discovery-stat-value ch-xp-green">{formatGain(gains.monthly.totalXp)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skills */}
        <div className="ch-player-skills-section">
          <h3 className="ch-player-section-title">Skills</h3>
          <div className="ch-player-skills-grid">
            {skills.map((skill) => (
              <div key={skill.name} className="ch-stat-cell ch-player-skill-card">
                <span className="ch-player-skill-name">{getSkillDisplayName(skill.name)}</span>
                <span className="ch-player-skill-level">{skill.level}</span>
                <span className="ch-player-skill-xp">{formatXp(skill.xp)} XP</span>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Placeholders */}
        <div className="ch-player-history-section">
          <h3 className="ch-player-section-title">History</h3>
          {data.hasHistory ? (
            <div className="ch-stat-cell ch-player-history-placeholder">
              <p>{data.snapshotCount} snapshots recorded</p>
              <p className="ch-player-history-note">XP graphs and detailed skill history coming soon.</p>
            </div>
          ) : (
            <div className="ch-stat-cell ch-player-history-placeholder">
              <p>No historical data yet.</p>
              <p className="ch-player-history-note">Snapshots are generated daily — check back soon for XP history and skill progression.</p>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="ch-player-activity-section">
          <h3 className="ch-player-section-title">Activity</h3>
          {activity.length > 0 ? (
            <div className="ch-player-activity-list">
              {activity.map((event) => (
                <div key={event.id} className="ch-stat-cell ch-player-activity-item">
                  <span className="ch-player-activity-type">{formatEventType(event.eventType)}</span>
                  <span className="ch-player-activity-detail">{formatEventDetail(event)}</span>
                  <span className="ch-player-activity-time">{formatTimeAgo(event.occurredAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="ch-stat-cell ch-player-history-placeholder">
              <p>No activity detected yet.</p>
              <p className="ch-player-history-note">Activity events (XP gains, level-ups, clan changes) will appear here once snapshots are generated.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatEventType(type: string): string {
  switch (type) {
    case "xp_gained": return "XP Gained"
    case "level_gained": return "Level Up"
    case "clan_changed": return "Clan Changed"
    case "member_joined": return "Joined Clan"
    case "member_left": return "Left Clan"
    default: return type.replace(/_/g, " ")
  }
}

function formatEventDetail(event: ActivityEvent): string {
  const meta = event.metadata
  if (!meta) return ""

  switch (event.eventType) {
    case "xp_gained":
      return `+${formatXp(meta.xp_gained as number)} XP`
    case "level_gained":
      if (meta.skill) return `${getSkillDisplayName(meta.skill as string)} → Level ${meta.new_level}`
      return `Total Level → ${meta.total_level}`
    case "clan_changed":
      return `Moved to ${meta.new_clan || "Unknown"}`
    default:
      return ""
  }
}

function formatTimeAgo(isoDate: string): string {
  const now = new Date()
  const date = new Date(isoDate)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
