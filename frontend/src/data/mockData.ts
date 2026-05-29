export interface PlatformStats {
  clansTracked: number
  playersTracked: number
  xpGainedThisWeek: string
  activeCompetitions: number
}

export interface RankedClan {
  rank: number
  name: string
  memberCount: number
  totalXp: string
  weeklyXp: string
  gameType: "RS3" | "OSRS"
  growthPercent?: number
  activeMembers?: number
}

export interface FeaturedClan {
  name: string
  tagline: string
  memberCount: number
  activeMembers: number
  weeklyXp: string
  gameType: "RS3" | "OSRS"
  bannerColor: string
  accentColor: string
  founded: string
}

export interface RankedPlayer {
  rank: number
  username: string
  clanName: string
  weeklyXp: string
  totalLevel: number
  gameType: "RS3" | "OSRS"
}

export interface ActivityEvent {
  id: number
  type: "xp_milestone" | "clan_growth" | "competition_end" | "player_achievement" | "new_clan"
  title: string
  description: string
  timeAgo: string
  clanName?: string
  gameType?: "RS3" | "OSRS"
}

export const platformStats: PlatformStats = {
  clansTracked: 847,
  playersTracked: 142_380,
  xpGainedThisWeek: "89.2B",
  activeCompetitions: 234,
}

export const topRS3Clans: RankedClan[] = [
  { rank: 1, name: "Celestial Order", memberCount: 487, totalXp: "892.4B", weeklyXp: "4.2B", gameType: "RS3" },
  { rank: 2, name: "Dark Alliance", memberCount: 423, totalXp: "756.1B", weeklyXp: "3.8B", gameType: "RS3" },
  { rank: 3, name: "Stormlight", memberCount: 312, totalXp: "623.7B", weeklyXp: "3.1B", gameType: "RS3" },
  { rank: 4, name: "Phoenix Rising", memberCount: 298, totalXp: "541.2B", weeklyXp: "2.7B", gameType: "RS3" },
  { rank: 5, name: "Primal Force", memberCount: 276, totalXp: "498.3B", weeklyXp: "2.4B", gameType: "RS3" },
]

export const topOSRSClans: RankedClan[] = [
  { rank: 1, name: "Iron Legacy", memberCount: 534, totalXp: "412.8B", weeklyXp: "2.9B", gameType: "OSRS" },
  { rank: 2, name: "Wilderness Wolves", memberCount: 401, totalXp: "367.2B", weeklyXp: "2.5B", gameType: "OSRS" },
  { rank: 3, name: "Ancient Guard", memberCount: 378, totalXp: "312.6B", weeklyXp: "2.1B", gameType: "OSRS" },
  { rank: 4, name: "GE Rats", memberCount: 345, totalXp: "289.4B", weeklyXp: "1.9B", gameType: "OSRS" },
  { rank: 5, name: "Lumbridge Legends", memberCount: 289, totalXp: "245.1B", weeklyXp: "1.7B", gameType: "OSRS" },
]

export const fastestGrowingClans: RankedClan[] = [
  { rank: 1, name: "Nova Collective", memberCount: 156, totalXp: "89.2B", weeklyXp: "1.8B", gameType: "RS3", growthPercent: 34 },
  { rank: 2, name: "Twisted League", memberCount: 201, totalXp: "124.5B", weeklyXp: "1.5B", gameType: "OSRS", growthPercent: 28 },
  { rank: 3, name: "Rune Syndicate", memberCount: 134, totalXp: "67.8B", weeklyXp: "1.2B", gameType: "RS3", growthPercent: 23 },
  { rank: 4, name: "Shadow Covenant", memberCount: 189, totalXp: "98.3B", weeklyXp: "1.1B", gameType: "OSRS", growthPercent: 19 },
  { rank: 5, name: "Crystal Seekers", memberCount: 112, totalXp: "45.6B", weeklyXp: "0.9B", gameType: "RS3", growthPercent: 17 },
]

export const featuredClans: FeaturedClan[] = [
  {
    name: "Celestial Order",
    tagline: "Reaching for the stars since 2019",
    memberCount: 487,
    activeMembers: 312,
    weeklyXp: "4.2B",
    gameType: "RS3",
    bannerColor: "from-indigo-600 to-purple-700",
    accentColor: "text-indigo-400",
    founded: "2019",
  },
  {
    name: "Iron Legacy",
    tagline: "Forged in iron, bound by honor",
    memberCount: 534,
    activeMembers: 389,
    weeklyXp: "2.9B",
    gameType: "OSRS",
    bannerColor: "from-amber-600 to-orange-700",
    accentColor: "text-amber-400",
    founded: "2020",
  },
  {
    name: "Dark Alliance",
    tagline: "Strength through unity",
    memberCount: 423,
    activeMembers: 287,
    weeklyXp: "3.8B",
    gameType: "RS3",
    bannerColor: "from-red-600 to-rose-800",
    accentColor: "text-red-400",
    founded: "2018",
  },
  {
    name: "Ancient Guard",
    tagline: "Guardians of the old ways",
    memberCount: 378,
    activeMembers: 245,
    weeklyXp: "2.1B",
    gameType: "OSRS",
    bannerColor: "from-emerald-600 to-teal-700",
    accentColor: "text-emerald-400",
    founded: "2021",
  },
  {
    name: "Phoenix Rising",
    tagline: "From the ashes, we rise",
    memberCount: 298,
    activeMembers: 194,
    weeklyXp: "2.7B",
    gameType: "RS3",
    bannerColor: "from-sky-600 to-cyan-700",
    accentColor: "text-sky-400",
    founded: "2020",
  },
  {
    name: "Wilderness Wolves",
    tagline: "Masters of the wild",
    memberCount: 401,
    activeMembers: 278,
    weeklyXp: "2.5B",
    gameType: "OSRS",
    bannerColor: "from-violet-600 to-fuchsia-700",
    accentColor: "text-violet-400",
    founded: "2017",
  },
]

export const topPlayers: RankedPlayer[] = [
  { rank: 1, username: "xP_Wizard", clanName: "Celestial Order", weeklyXp: "142.3M", totalLevel: 2898, gameType: "RS3" },
  { rank: 2, username: "IronMaidenRS", clanName: "Iron Legacy", weeklyXp: "128.7M", totalLevel: 2277, gameType: "OSRS" },
  { rank: 3, username: "Dark_Mage_42", clanName: "Dark Alliance", weeklyXp: "118.4M", totalLevel: 2856, gameType: "RS3" },
  { rank: 4, username: "Pk3r_Supreme", clanName: "Wilderness Wolves", weeklyXp: "105.2M", totalLevel: 2198, gameType: "OSRS" },
  { rank: 5, username: "QuestCapeLord", clanName: "Stormlight", weeklyXp: "97.8M", totalLevel: 2898, gameType: "RS3" },
  { rank: 6, username: "SkillMaster_X", clanName: "Ancient Guard", weeklyXp: "89.1M", totalLevel: 2245, gameType: "OSRS" },
  { rank: 7, username: "RuneQueen", clanName: "Phoenix Rising", weeklyXp: "82.4M", totalLevel: 2834, gameType: "RS3" },
  { rank: 8, username: "GE_Flipper", clanName: "GE Rats", weeklyXp: "76.9M", totalLevel: 2156, gameType: "OSRS" },
]

export const recentActivity: ActivityEvent[] = [
  {
    id: 1,
    type: "xp_milestone",
    title: "200M XP Milestone",
    description: "xP_Wizard reached 200M Invention XP",
    timeAgo: "12 minutes ago",
    clanName: "Celestial Order",
    gameType: "RS3",
  },
  {
    id: 2,
    type: "competition_end",
    title: "Competition Ended",
    description: "Weekend Skilling Sprint won by Iron Legacy with 1.2B total XP",
    timeAgo: "34 minutes ago",
    clanName: "Iron Legacy",
    gameType: "OSRS",
  },
  {
    id: 3,
    type: "clan_growth",
    title: "Clan Milestone",
    description: "Nova Collective reached 150 members",
    timeAgo: "1 hour ago",
    clanName: "Nova Collective",
    gameType: "RS3",
  },
  {
    id: 4,
    type: "player_achievement",
    title: "Max Cape Achieved",
    description: "Dark_Mage_42 achieved Max Cape (level 99 in all skills)",
    timeAgo: "2 hours ago",
    clanName: "Dark Alliance",
    gameType: "RS3",
  },
  {
    id: 5,
    type: "new_clan",
    title: "New Clan Registered",
    description: "Shadow Covenant joined Clan Haven with 189 members",
    timeAgo: "3 hours ago",
    clanName: "Shadow Covenant",
    gameType: "OSRS",
  },
  {
    id: 6,
    type: "xp_milestone",
    title: "99 Slayer",
    description: "Pk3r_Supreme reached level 99 Slayer",
    timeAgo: "4 hours ago",
    clanName: "Wilderness Wolves",
    gameType: "OSRS",
  },
  {
    id: 7,
    type: "competition_end",
    title: "Competition Ended",
    description: "RS3 Boss Kill Count Challenge won by Phoenix Rising",
    timeAgo: "5 hours ago",
    clanName: "Phoenix Rising",
    gameType: "RS3",
  },
  {
    id: 8,
    type: "clan_growth",
    title: "Activity Surge",
    description: "Stormlight saw a 45% increase in weekly active members",
    timeAgo: "6 hours ago",
    clanName: "Stormlight",
    gameType: "RS3",
  },
]
