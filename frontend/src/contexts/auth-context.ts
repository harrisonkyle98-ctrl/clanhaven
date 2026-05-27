import { createContext } from "react"

interface User {
  id: string
  discordId: string
  username: string
  avatar: string | null
  email: string | null
  roles: string[]
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
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
