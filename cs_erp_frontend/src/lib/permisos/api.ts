import { extractApiErrorMessage } from '@/lib/auth/api-error'
import { api } from '@/lib/auth/api-client'
import type { PermisoUsuarioRow, PermisosListResponse, SetPermisoPayload } from './types'

const ENDPOINT = '/permiso-usuario'

export const listPermisosApi = async (): Promise<PermisosListResponse> => {
  try {
    const response = await api.get<PermisosListResponse>(ENDPOINT)
    return response.data
  } catch (error: unknown) {
    throw new Error(extractApiErrorMessage(error, 'No se pudo cargar los permisos'))
  }
}

export const setPermisoApi = async (payload: SetPermisoPayload): Promise<PermisoUsuarioRow> => {
  try {
    const response = await api.patch<PermisoUsuarioRow>(ENDPOINT, payload)
    return response.data
  } catch (error: unknown) {
    throw new Error(extractApiErrorMessage(error, 'No se pudo actualizar el permiso'))
  }
}
