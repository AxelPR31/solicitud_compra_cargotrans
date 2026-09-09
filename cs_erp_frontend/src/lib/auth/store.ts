import { create } from 'zustand'
import type { AuthUser } from './types'

interface AuthStoreState {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
