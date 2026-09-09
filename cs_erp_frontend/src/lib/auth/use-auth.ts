import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meApi, logoutApi, refreshSessionApi, signInApi } from './api'
import { useAuthStore } from './store'
import type { SignInDto } from './types'

const AUTH_QUERY_KEY = ['auth', 'me'] as const

export const useAuth = () => {
  const queryClient = useQueryClient()
  const { user, setUser, clearUser } = useAuthStore()
  const hasTriedRefresh = useRef(false)

  const meQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: meApi,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })

  const refreshMutation = useMutation({
    mutationFn: refreshSessionApi,
    onSuccess: (nextUser) => {
      setUser(nextUser)
      queryClient.setQueryData(AUTH_QUERY_KEY, nextUser)
    },
    onError: () => {
      clearUser()
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY })
    },
  })

  const loginMutation = useMutation({
    mutationFn: (payload: SignInDto) => signInApi(payload),
    onSuccess: (nextUser) => {
      setUser(nextUser)
      queryClient.setQueryData(AUTH_QUERY_KEY, nextUser)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      clearUser()
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY })
    },
  })

  const login = async (usuario: string, password: string) => {
    return await loginMutation.mutateAsync({
      usuario,
      contrasena: password,
    })
  }

  const logout = () => {
    logoutMutation.mutate()
  }

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data)
      hasTriedRefresh.current = false
    }
  }, [meQuery.data, setUser])

  useEffect(() => {
    if (meQuery.isError && !user && !hasTriedRefresh.current) {
      hasTriedRefresh.current = true
      refreshMutation.mutate()
    }
  }, [meQuery.isError, refreshMutation, user])

  const isAuthenticated = Boolean(user)
  const isLoading = meQuery.isLoading || loginMutation.isPending || logoutMutation.isPending

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    meQuery,
    refreshMutation,
    loginMutation,
    logoutMutation,
  }
}
