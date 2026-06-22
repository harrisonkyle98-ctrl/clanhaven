import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { apiFetch } from "@/lib/api"
import CollapsiblePanel from "@/components/CollapsiblePanel"
import { MiniClanVexillum } from "@/components/MiniClanVexillum"

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
  primaryColor: string | null
  secondaryColor: string | null
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
  hasStats: boolean
}



function formatXp(xp: number, hasStats: boolean): string {
  if (!hasStats) return "-"
  if (xp >= 1_000_000_000) return `${(xp / 1_000_000_000).toFixed(1)}B`
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`
  return xp.toLocaleString()
}

function formatXpFull(xp: number, hasStats: boolean): string {
  if (!hasStats) return "-"
  return xp.toLocaleString()
}

function formatLevel(level: number, hasStats: boolean): string {
  if (!hasStats) return "-"
  return level.toLocaleString()
}

function formatSkillXp(xp: number, level: number): string {
  if (level === 0 && xp === 0) return "-"
  return xp.toLocaleString()
}

function formatSkillLevel(level: number, xp: number): string {
  if (level === 0 && xp === 0) return "-"
  return level.toString()
}

function getAccountTypeLabel(type: string): string | null {
  switch (type) {
    case "ironman": return "Ironman"
    case "hardcore_ironman": return "Hardcore Ironman"
    case "group_ironman": return "Group Ironman"
    default: return null
  }
}

function getAccountTypeIcon(type: string): string | null {
  switch (type) {
    case "ironman": return "/images/sprites/ironman.png"
    case "hardcore_ironman": return "/images/sprites/hardcore.png"
    default: return null
  }
}

function getSkillDisplayName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/** Per-skill colors from Stormlight, desaturated/darkened for Clan Haven fantasy theme */
const SKILL_COLORS: Record<string, { color: string; pattern: string; border: string }> = {
  attack:         { color: "rgba(115, 58, 58, 0.95)",  pattern: "rgba(150, 88, 88, 0.6)",   border: "rgba(75, 35, 35, 0.95)" },
  defence:        { color: "rgba(75, 85, 100, 0.95)",  pattern: "rgba(110, 125, 145, 0.6)", border: "rgba(48, 55, 68, 0.95)" },
  strength:       { color: "rgba(62, 102, 78, 0.95)",  pattern: "rgba(95, 145, 108, 0.6)",  border: "rgba(35, 68, 46, 0.95)" },
  constitution:   { color: "rgba(122, 62, 62, 0.95)",  pattern: "rgba(160, 92, 92, 0.6)",   border: "rgba(82, 35, 35, 0.95)" },
  ranged:         { color: "rgba(72, 78, 62, 0.95)",   pattern: "rgba(108, 118, 90, 0.6)",  border: "rgba(45, 50, 38, 0.95)" },
  prayer:         { color: "rgba(145, 142, 138, 0.95)", pattern: "rgba(185, 182, 178, 0.6)",  border: "rgba(100, 98, 95, 0.95)" },
  magic:          { color: "rgba(58, 65, 98, 0.95)",   pattern: "rgba(85, 95, 140, 0.6)",   border: "rgba(35, 42, 65, 0.95)" },
  cooking:        { color: "rgba(80, 62, 82, 0.95)",   pattern: "rgba(115, 88, 118, 0.6)",  border: "rgba(50, 35, 52, 0.95)" },
  woodcutting:    { color: "rgba(55, 65, 50, 0.95)",   pattern: "rgba(82, 98, 75, 0.6)",    border: "rgba(32, 42, 28, 0.95)" },
  fletching:      { color: "rgba(58, 75, 72, 0.95)",   pattern: "rgba(82, 108, 105, 0.6)",  border: "rgba(35, 48, 46, 0.95)" },
  fishing:        { color: "rgba(78, 88, 98, 0.95)",   pattern: "rgba(112, 125, 140, 0.6)", border: "rgba(50, 58, 65, 0.95)" },
  firemaking:     { color: "rgba(108, 85, 55, 0.95)",  pattern: "rgba(148, 118, 75, 0.6)",  border: "rgba(72, 52, 30, 0.95)" },
  crafting:       { color: "rgba(92, 82, 68, 0.95)",   pattern: "rgba(130, 115, 95, 0.6)",  border: "rgba(58, 50, 38, 0.95)" },
  smithing:       { color: "rgba(112, 105, 65, 0.95)", pattern: "rgba(152, 142, 85, 0.6)",  border: "rgba(75, 68, 38, 0.95)" },
  mining:         { color: "rgba(68, 98, 98, 0.95)",   pattern: "rgba(95, 138, 140, 0.6)",  border: "rgba(42, 65, 65, 0.95)" },
  herblore:       { color: "rgba(50, 72, 52, 0.95)",   pattern: "rgba(72, 108, 75, 0.6)",   border: "rgba(28, 48, 30, 0.95)" },
  agility:        { color: "rgba(75, 75, 98, 0.95)",   pattern: "rgba(108, 108, 138, 0.6)", border: "rgba(48, 48, 65, 0.95)" },
  thieving:       { color: "rgba(78, 65, 80, 0.95)",   pattern: "rgba(112, 92, 115, 0.6)",  border: "rgba(48, 38, 50, 0.95)" },
  slayer:         { color: "rgba(95, 45, 45, 0.95)",   pattern: "rgba(132, 68, 68, 0.6)",   border: "rgba(62, 25, 25, 0.95)" },
  farming:        { color: "rgba(80, 130, 75, 0.95)",  pattern: "rgba(120, 175, 115, 0.6)", border: "rgba(50, 90, 45, 0.95)" },
  runecrafting:   { color: "rgba(108, 98, 60, 0.95)",  pattern: "rgba(148, 132, 80, 0.6)",  border: "rgba(72, 62, 35, 0.95)" },
  hunter:         { color: "rgba(110, 105, 90, 0.95)", pattern: "rgba(155, 150, 130, 0.6)", border: "rgba(75, 70, 55, 0.95)" },
  construction:   { color: "rgba(112, 88, 55, 0.95)",  pattern: "rgba(152, 120, 72, 0.6)",  border: "rgba(75, 55, 30, 0.95)" },
  summoning:      { color: "rgba(90, 98, 108, 0.95)",  pattern: "rgba(128, 138, 155, 0.6)", border: "rgba(58, 62, 75, 0.95)" },
  dungeoneering:  { color: "rgba(135, 95, 50, 0.95)",  pattern: "rgba(180, 130, 75, 0.6)",  border: "rgba(90, 60, 30, 0.95)" },
  divination:     { color: "rgba(82, 68, 105, 0.95)",  pattern: "rgba(115, 98, 145, 0.6)",  border: "rgba(52, 42, 70, 0.95)" },
  invention:      { color: "rgba(112, 108, 60, 0.95)", pattern: "rgba(152, 148, 80, 0.6)",  border: "rgba(75, 72, 35, 0.95)" },
  archaeology:    { color: "rgba(55, 50, 50, 0.95)",   pattern: "rgba(85, 75, 75, 0.6)",    border: "rgba(30, 25, 25, 0.95)" },
  necromancy:     { color: "rgba(82, 62, 105, 0.95)",  pattern: "rgba(115, 88, 145, 0.6)",  border: "rgba(52, 38, 70, 0.95)" },
}

function getSkillMilestone(level: number, xp: number): string | null {
  if (xp >= 200_000_000) return "200m"
  if (level >= 120) return "120"
  if (level >= 99) return "99"
  return null
}

function getSkillIconStyle(name: string): React.CSSProperties {
  const colors = SKILL_COLORS[name]
  if (!colors) return {}
  return {
    "--sib-color": colors.color,
    "--sib-pattern": colors.pattern,
    "--sib-border": colors.border,
  } as React.CSSProperties
}

export default function PlayerProfile() {
  const { rsn } = useParams<{ rsn: string }>()
  const [data, setData] = useState<PlayerProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("skills")

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

  const { player, clan, skills, hasStats } = data
  const accountLabel = getAccountTypeLabel(player.accountType)
  const accountIcon = getAccountTypeIcon(player.accountType)

  const TABS: { key: string; label: string }[] = [
    { key: "skills", label: "Skills" },
    { key: "activity", label: "Activity" },
    { key: "achievements", label: "Achievements" },
    { key: "history", label: "History" },
  ]

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
          {/* Left sidebar: Clan banner + Player info card */}
          <div className="ch-player-sidebar">
            {clan && (
              <Link to={`/${clan.slug}`} className="ch-stat-cell ch-player-clan-banner" style={{ textDecoration: "none", display: "block" }}>
                <div className="ch-discovery-card-header">
                  <img src="/images/clancardbg.png" alt="" className="ch-discovery-card-header-bg" />
                  <div className="ch-discovery-card-header-overlay" />
                  <div className="ch-discovery-card-header-content">
                    <div className="ch-discovery-card-header-center">
                      <div className="ch-discovery-card-name">{clan.name}</div>
                    </div>
                  </div>
                  <div className="ch-discovery-card-vexillum">
                    <MiniClanVexillum
                      primaryColor={clan.primaryColor ?? undefined}
                      secondaryColor={clan.secondaryColor ?? undefined}
                      size={72}
                    />
                  </div>
                </div>
              </Link>
            )}
            <div className="ch-stat-cell ch-player-sidebar-card">
              <div className="ch-player-sidebar-header">
                <h2 className="ch-player-name">
                  {player.rsn}
                  {accountIcon && (
                    <img
                      src={accountIcon}
                      alt={accountLabel || ""}
                      title={accountLabel || ""}
                      style={{ width: "12px", height: "12px", objectFit: "contain", marginLeft: "3px", verticalAlign: "middle" }}
                    />
                  )}
                </h2>
                <div className="ch-player-tags">
                  <span className="ch-player-tag ch-player-tag--rs3">RS3</span>
                  {accountLabel && (
                    <span className="ch-player-tag ch-player-tag--ironman">{accountLabel}</span>
                  )}
                </div>
              </div>

              {clan && clan.rank && (
                <div className="ch-player-sidebar-clan">
                  <span className="ch-player-sidebar-label">Clan Rank</span>
                  <span className="ch-player-clan-rank">{clan.rank}</span>
                </div>
              )}

              <div className="ch-player-sidebar-stats">
                <div className="ch-player-sidebar-stat">
                  <span className="ch-player-sidebar-label">Total Level</span>
                  <span className="ch-player-sidebar-value">{formatLevel(player.totalLevel, hasStats)}</span>
                </div>
                <div className="ch-player-sidebar-stat">
                  <span className="ch-player-sidebar-label">Total XP</span>
                  <span className="ch-player-sidebar-value ch-xp-green">{formatXp(player.totalXp, hasStats)}</span>
                </div>
                <div className="ch-player-sidebar-stat">
                  <span className="ch-player-sidebar-label">Combat Level</span>
                  <span className="ch-player-sidebar-value">{formatLevel(player.combatLevel, hasStats)}</span>
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

          {/* Right content: Tabs + content */}
          <div className="ch-player-main">
            {/* Tab bar */}
            <div className="ch-player-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`ch-sidebar-btn ch-player-tab${activeTab === tab.key ? " ch-sidebar-btn-active ch-player-tab--active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "skills" && (
              <CollapsiblePanel variant="blue" title="Skills">
                <div className="ch-player-skill-rows">
                  {/* Total XP row first */}
                  <div className="ch-log-row ch-player-skill-row" style={{ "--row-accent": "#a49680" } as React.CSSProperties}>
                    <div className="ch-skill-icon-col ch-skill-icon-block--blue">
                      <img src="/images/skills/overall.png" alt="Overall" className="ch-player-skill-icon" />
                    </div>
                    <div className="ch-player-skill-row-content">
                      <span className="ch-player-skill-row-name">Overall</span>
                      <span className="ch-player-skill-row-xp">{formatXpFull(player.totalXp, hasStats)} XP</span>
                      <div className="ch-skill-row-notch">
                        <div className="ch-skill-row-notch-mid">
                          <div className="ch-skill-row-notch-fill"></div>
                        </div>
                      </div>
                      <span className="ch-player-skill-row-level">{formatLevel(player.totalLevel, hasStats)}</span>
                    </div>
                  </div>

                  {/* Individual skill rows */}
                  {skills.map((skill) => (
                    <div key={skill.name} className="ch-log-row ch-player-skill-row" style={{ "--row-accent": "#a49680" } as React.CSSProperties}>
                      <div className="ch-skill-icon-col" style={getSkillIconStyle(skill.name)}>
                        <img src={`/images/skills/${skill.name}.png`} alt={skill.name} className="ch-player-skill-icon" />
                      </div>
                      <div className="ch-player-skill-row-content">
                        <span className="ch-player-skill-row-name">{getSkillDisplayName(skill.name)}</span>
                        <span className="ch-player-skill-row-xp">{formatSkillXp(skill.xp, skill.level)} XP</span>
                        <div className="ch-skill-row-notch">
                          <div className="ch-skill-row-notch-mid">
                            <div className="ch-skill-row-notch-fill"></div>
                          </div>
                        </div>
                        <span className={`ch-player-skill-row-level${getSkillMilestone(skill.level, skill.xp) ? ` ch-profile-level--${getSkillMilestone(skill.level, skill.xp)}` : ""}`}>{formatSkillLevel(skill.level, skill.xp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsiblePanel>
            )}

            {activeTab === "activity" && (
              <CollapsiblePanel variant="blue" title="Activity">
                <div className="ch-player-tab-placeholder">
                  <p>Activity tracking coming soon.</p>
                </div>
              </CollapsiblePanel>
            )}

            {activeTab === "achievements" && (
              <CollapsiblePanel variant="blue" title="Achievements">
                <div className="ch-player-tab-placeholder">
                  <p>Achievements coming soon.</p>
                </div>
              </CollapsiblePanel>
            )}

            {activeTab === "history" && (
              <CollapsiblePanel variant="blue" title="History">
                <div className="ch-player-tab-placeholder">
                  <p>Clan membership history coming soon.</p>
                </div>
              </CollapsiblePanel>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
