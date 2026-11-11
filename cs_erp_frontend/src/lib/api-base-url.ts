/**
 * Producción / IIS (mismo dominio): vacío → rutas relativas al sitio.
 * Desarrollo: `/backend` (proxy en next.config → Nest en :7500).
 * Así la cookie de sesión queda en localhost:3000 y no falla GET /auth.
 *
 * Evita `http://localhost:7500` en el navegador en dev (otro puerto = otra cookie).
 */
const DEV_API_DEFAULT = '/backend'

const normalizeDevBackendUrl = (raw: string): string => {
  if (process.env.NODE_ENV !== 'development') return raw
  if (/^https?:\/\/(localhost|127\.0\.0\.1):7500\/?$/i.test(raw)) {
    return DEV_API_DEFAULT
  }
  try {
    const u = new URL(raw.startsWith('http') ? raw : `http://${raw}`)
    const local =
      u.hostname === 'localhost' ||
      u.hostname === '127.0.0.1' ||
      u.hostname === '[::1]'
    if (local && u.protocol === 'https:') {
      return DEV_API_DEFAULT
    }
  } catch {
  }
  if (raw === '/backend' || raw.startsWith('/backend/')) return DEV_API_DEFAULT
  return raw
}

export const API_BASE_URL = (() => {
  const fromEnv = (process.env.NEXT_PUBLIC_BACKEND_API_URL ?? '').trim()
  if (fromEnv) {
    const normalized = normalizeDevBackendUrl(fromEnv).replace(/\/$/, '')
    return normalized
  }
  if (process.env.NODE_ENV === 'development') {
    return DEV_API_DEFAULT
  }
  return ''
})()
