import { useEffect } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import axios from 'axios'
import { meApi } from '@/lib/auth/api'
import { AUTH_QUERY_KEY } from '@/lib/auth/query-keys'
import type { AuthUser } from '@/lib/auth/types'
import {
  canAprobarOrdenCompra,
  canAprobarSolicitudCompra,
  canManagePermisos,
  canRegistrarSolicitudCompra,
} from '@/lib/auth/session-flags'
import { useAuthStore } from '@/lib/auth/store'
import { listPermisosApi, setPermisoApi } from './api'
import {
  PERMISO_CS_ADMIN,
  PERMISO_CS_APROBAR_OC,
  PERMISO_CS_APROBAR_SOLICITUD,
  PERMISO_CS_REGISTRAR_SOLICITUD,
} from './codigos'
import { PERMISOS_MATRIX_QUERY_KEY } from './query-keys'
import type { PermisoUsuarioRow, PermisosListResponse, SetPermisoPayload } from './types'

const authUser = (permisosCs: string[]): AuthUser => ({ permisosCs }) as AuthUser

/** Permisos CS en sesión (lee CS_PERMISO_USUARIO vía GET /auth). */
export const usePermisosCsQuery = () =>
  useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: meApi,
    staleTime: 1000 * 60 * 5,
    select: (user: AuthUser) => user.permisosCs ?? [],
  })

function usePermisosSessionFlags<T>(selector: (user: AuthUser) => T) {
  const permisosQuery = usePermisosCsQuery()
  const sessionUser = useAuthStore((s) => s.user)
  const isAuthenticated = Boolean(sessionUser)
  const permisosCs = permisosQuery.data ?? sessionUser?.permisosCs ?? []
  const ready = isAuthenticated && !permisosQuery.isLoading

  return {
    permisosQuery,
    permisosCs,
    value: ready ? selector(authUser(permisosCs)) : false,
    isLoading: permisosQuery.isLoading,
  }
}

export const useCanRegistrarSolicitudCompraQuery = () => {
  const { permisosQuery, value, isLoading } = usePermisosSessionFlags(canRegistrarSolicitudCompra)
  return { permisosQuery, canRegistrarSolicitudCompra: value, isLoading }
}

export const useCanAprobarSolicitudCompraQuery = () => {
  const { permisosQuery, value, isLoading } = usePermisosSessionFlags(canAprobarSolicitudCompra)
  return { permisosQuery, canAprobarSolicitudCompra: value, isLoading }
}

export const useCanAprobarOrdenCompraQuery = () => {
  const { permisosQuery, value, isLoading } = usePermisosSessionFlags(canAprobarOrdenCompra)
  return { permisosQuery, canAprobarOrdenCompra: value, isLoading }
}

export const useCanManagePermisosQuery = () => {
  const { permisosQuery, permisosCs, value, isLoading } = usePermisosSessionFlags(canManagePermisos)
  return {
    permisosQuery,
    permisosCs,
    canManagePermisos: value,
    isLoading,
  }
}

/** Matriz usuarios × permisos (tabla CS + ERPADMIN.USUARIO). */
export const usePermisosMatrixQuery = (enabled: boolean) =>
  useQuery({
    queryKey: PERMISOS_MATRIX_QUERY_KEY,
    queryFn: listPermisosApi,
    enabled,
    staleTime: 1000 * 30,
    retry: false,
  })

const stripAdminFromSession = (prev: AuthUser | null | undefined) => {
  if (!prev) return prev
  const permisosCs = (prev.permisosCs ?? []).filter(
    (p) => p.trim().toUpperCase() !== PERMISO_CS_ADMIN,
  )
  return { ...prev, permisosCs }
}

function optimisticRowPatch(row: PermisoUsuarioRow, payload: SetPermisoPayload): PermisoUsuarioRow {
  const { permiso, activo } = payload
  if (permiso === PERMISO_CS_ADMIN) {
    if (activo) {
      return {
        ...row,
        admin: true,
        registrarSolicitud: true,
        aprobarSolicitud: true,
        aprobarOc: true,
      }
    }
    return { ...row, admin: false }
  }
  if (permiso === PERMISO_CS_REGISTRAR_SOLICITUD) {
    return {
      ...row,
      registrarSolicitud: activo || row.aprobarSolicitud || row.admin,
    }
  }
  if (permiso === PERMISO_CS_APROBAR_SOLICITUD) {
    return {
      ...row,
      aprobarSolicitud: activo,
      registrarSolicitud: activo ? true : row.registrarSolicitud,
    }
  }
  if (permiso === PERMISO_CS_APROBAR_OC) {
    return { ...row, aprobarOc: activo || row.admin }
  }
  return row
}

/** PATCH permiso en CS_PERMISO_USUARIO. */
export const useSetPermisoMutation = () => {
  const queryClient = useQueryClient()
  const sessionUsuario = useAuthStore((s) => s.user?.usuario)

  return useMutation({
    mutationFn: (payload: SetPermisoPayload) => setPermisoApi(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: PERMISOS_MATRIX_QUERY_KEY })
      const previous = queryClient.getQueryData<PermisosListResponse>(
        PERMISOS_MATRIX_QUERY_KEY,
      )
      if (previous?.items) {
        queryClient.setQueryData<PermisosListResponse>(PERMISOS_MATRIX_QUERY_KEY, {
          items: previous.items.map((row) =>
            row.usuario !== payload.usuario ? row : optimisticRowPatch(row, payload),
          ),
        })
      }
      return { previous }
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PERMISOS_MATRIX_QUERY_KEY, context.previous)
      }
    },
    onSuccess: (row) => {
      queryClient.setQueryData<PermisosListResponse>(
        PERMISOS_MATRIX_QUERY_KEY,
        (old) => {
          if (!old?.items) return old ?? { items: [row] }
          return {
            items: old.items.map((i) => (i.usuario === row.usuario ? row : i)),
          }
        },
      )
      if (row.usuario === sessionUsuario) {
        void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
      }
    },
  })
}

/** Panel admin: matriz + mutación + sincronía si el API niega ADMIN. */
export const usePermisosAdmin = (enabled: boolean) => {
  const queryClient = useQueryClient()
  const matrixQuery = usePermisosMatrixQuery(enabled)
  const setMutation = useSetPermisoMutation()

  useEffect(() => {
    if (!matrixQuery.isError) return
    const err = matrixQuery.error
    if (!axios.isAxiosError(err) || err.response?.status !== 403) return

    const current = useAuthStore.getState().user
    if (current) {
      useAuthStore.getState().setUser(stripAdminFromSession(current)!)
    }
    queryClient.setQueryData(AUTH_QUERY_KEY, stripAdminFromSession)
  }, [matrixQuery.isError, matrixQuery.error, queryClient])

  return {
    matrixQuery,
    setMutation,
  }
}
