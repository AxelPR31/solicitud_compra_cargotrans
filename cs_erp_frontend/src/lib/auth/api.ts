import axios from 'axios'
import { extractApiErrorMessage } from './api-error'
import { api } from './api-client'
import type { AuthUser, SignInDto } from './types'

const AUTH_ENDPOINT = '/auth'

export class AuthApiError extends Error {
  readonly status?: number
  readonly code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = 'AuthApiError'
    this.status = status
    this.code = code
  }
}

const toAuthApiError = (error: unknown, fallback: string): AuthApiError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const body = error.response?.data as { code?: string } | undefined
    return new AuthApiError(
      extractApiErrorMessage(error, fallback),
      status,
      body?.code,
    )
  }
  return new AuthApiError(fallback)
}

export const signInApi = async (payload: SignInDto): Promise<AuthUser> => {
  try {
    const response = await api.post<AuthUser>(`${AUTH_ENDPOINT}/signin`, payload)
    return response.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const message = extractApiErrorMessage(error, 'Credenciales inválidas')

      if (message.toLowerCase().includes('usuario sin proyectos asignados')) {
        throw new Error(message)
      }

      if (status === 400 || status === 401 || status === 403) {
        throw new Error('Credenciales inválidas')
      }
    }
    throw new Error(extractApiErrorMessage(error, 'Error al iniciar sesión'))
  }
}

export const meApi = async (): Promise<AuthUser> => {
  try {
    const response = await api.get<AuthUser>(AUTH_ENDPOINT)
    return response.data
  } catch (error: unknown) {
    throw toAuthApiError(error, 'No se pudo obtener la sesión')
  }
}

export const refreshSessionApi = async (): Promise<AuthUser> => {
  try {
    const response = await api.post<AuthUser>(`${AUTH_ENDPOINT}/refresh`)
    return response.data
  } catch (error: unknown) {
    throw new Error(extractApiErrorMessage(error, 'No se pudo refrescar la sesión'))
  }
}

export const logoutApi = async (): Promise<void> => {
  try {
    await api.post(`${AUTH_ENDPOINT}/logout`)
  } catch (error: unknown) {
    throw new Error(extractApiErrorMessage(error, 'No se pudo cerrar sesión'))
  }
}
