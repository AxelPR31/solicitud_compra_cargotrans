import axios from 'axios'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/lib/api-base-url'
import { useAuthStore } from './store'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

const isBrowser = typeof window !== 'undefined'

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error)
    }

    const status = error.response?.status
    if (!status) return Promise.reject(error)

    if (status === 401) {
      useAuthStore.getState().clearUser()
      if (isBrowser) {
        // Redirige al inicio (que mostrará el login)
        window.location.replace('/')
      }
    }

    if (status === 403) {
      if (isBrowser) {
        toast.error('No tiene permisos para realizar esta acción')
      }
    }

    return Promise.reject(error)
  },
)
