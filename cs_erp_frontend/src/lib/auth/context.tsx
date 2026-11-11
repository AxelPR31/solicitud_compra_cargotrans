'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useAuth as useAuthHook } from './use-auth'
import type { AuthUser } from './types'
import { useCanManagePermisosQuery } from '@/lib/permisos/use-permisos'

type AuthContextType = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  canManagePermisos: boolean
  login: (usuario: string, password: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, login, logout } = useAuthHook()
  const { canManagePermisos } = useCanManagePermisosQuery()

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      canManagePermisos,
      login,
      logout,
    }),
    [user, isAuthenticated, isLoading, canManagePermisos, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
