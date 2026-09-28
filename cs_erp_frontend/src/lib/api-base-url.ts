/**
 * En IIS (mismo dominio): dejar vacío o no definir NEXT_PUBLIC_BACKEND_API_URL.
 * En desarrollo: NEXT_PUBLIC_BACKEND_API_URL=http://localhost:7500
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_API_URL ?? ''
).trim()
