import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { apiFetch } from "@/lib/api"
import CollapsiblePanel from "@/components/CollapsiblePanel"

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



function formatXp(xp: number): string {
  if (xp >= 1_000_000_000) return `${(xp / 1_000_000_000).toFixed(1)}B`
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`
  return xp.toLocaleString()
}

function formatXpFull(xp: number): string {
  return xp.toLocaleString()
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

      <div className="ch-page-content p-4 lg:p-6">
        {/* Two-column layout: sidebar (30%) + skills (70%) */}
        <div className="ch-player-layout">
          {/* Left sidebar: Player info card */}
          <div className="ch-player-sidebar">
            <div className="ch-stat-cell ch-player-sidebar-card">
              <div className="ch-player-sidebar-header">
                <h2 className="ch-player-name">{player.rsn}</h2>
                <div className="ch-player-tags">
                  <span className="ch-player-tag ch-player-tag--rs3">RS3</span>
                  {accountLabel && (
                    <span className="ch-player-tag ch-player-tag--ironman">{accountLabel}</span>
                  )}
                </div>
              </div>

              {clan && (
                <div className="ch-player-sidebar-clan">
                  <span className="ch-player-sidebar-label">Clan</span>
                  <Link to={`/${clan.slug}`} className="ch-player-clan-link">
                    {clan.name}
                  </Link>
                  {clan.rank && <span className="ch-player-clan-rank">{clan.rank}</span>}
                </div>
              )}

              <div className="ch-player-sidebar-stats">
                <div className="ch-player-sidebar-stat">
                  <span className="ch-player-sidebar-label">Total Level</span>
                  <span className="ch-player-sidebar-value">{player.totalLevel.toLocaleString()}</span>
                </div>
                <div className="ch-player-sidebar-stat">
                  <span className="ch-player-sidebar-label">Total XP</span>
                  <span className="ch-player-sidebar-value ch-xp-green">{formatXp(player.totalXp)}</span>
                </div>
                <div className="ch-player-sidebar-stat">
                  <span className="ch-player-sidebar-label">Combat Level</span>
                  <span className="ch-player-sidebar-value">{player.combatLevel}</span>
                </div>
              </div>

              {data.hasHistory && (
                <div className="ch-player-sidebar-stat" style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(68, 58, 44, 0.3)" }}>
                  <span className="ch-player-sidebar-label">Snapshots</span>
                  <span className="ch-player-sidebar-value">{data.snapshotCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right content: Skills */}
          <div className="ch-player-main">
            <CollapsiblePanel variant="blue" title="Skills" headerRight={<span className="ch-clan-roster-count">{skills.length + 1} entries</span>}>
              <div className="ch-player-skill-rows">
                {/* Total XP row first */}
                <div className="ch-log-row ch-player-skill-row" style={{ "--row-accent": "#a49680" } as React.CSSProperties}>
                  <div className="ch-player-skill-row-inner">
                    <div className="ch-player-skill-icon-wrap">
                      <img src="/images/skills/overall.png" alt="Overall" className="ch-player-skill-icon" />
                    </div>
                    <div className="ch-player-skill-info">
                      <span className="ch-player-skill-row-name">Overall</span>
                      <span className="ch-player-skill-row-xp">{formatXpFull(player.totalXp)} XP</span>
                    </div>
                    <div className="ch-player-skill-level-badge">
                      {player.totalLevel.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Individual skill rows */}
                {skills.map((skill) => (
                  <div key={skill.name} className="ch-log-row ch-player-skill-row" style={{ "--row-accent": "#a49680" } as React.CSSProperties}>
                    <div className="ch-player-skill-row-inner">
                      <div className="ch-player-skill-icon-wrap">
                        <img src={`/images/skills/${skill.name}.png`} alt={skill.name} className="ch-player-skill-icon" />
                      </div>
                      <div className="ch-player-skill-info">
                        <span className="ch-player-skill-row-name">{getSkillDisplayName(skill.name)}</span>
                        <span className="ch-player-skill-row-xp">{formatXpFull(skill.xp)} XP</span>
                      </div>
                      <div className="ch-player-skill-level-badge">
                        {skill.level}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsiblePanel>
          </div>
        </div>
      </div>
    </div>
  )
}
