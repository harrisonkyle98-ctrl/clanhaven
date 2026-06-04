import { createContext } from "react"

interface User {
  id: string
  discordId: string
  username: string
  avatar: string | null
  email: string | null
  rsn: string | null
  gameType: string | null
  rsnClanName: string | null
  rsnLinkedAt: string | null
  privileges: number
  lastOnline: string | null
  clans: {
    clanId: string
    clanName: string | null
    rsn: string
    clanRole: string
    gameType: string | null
  }[]
}

export type { User }

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: () => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
