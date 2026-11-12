import type { AuthUser } from './types'
import {
  PERMISO_CS_ADMIN,
  PERMISO_CS_APROBAR_OC,
  PERMISO_CS_APROBAR_SOLICITUD,
  PERMISO_CS_REGISTRAR_SOLICITUD,
} from '@/lib/permisos/codigos'

function hasCode(codes: string[], codigo: string): boolean {
  const want = codigo.trim().toUpperCase()
  return codes.some((p) => p.trim().toUpperCase() === want)
}

/** Gestión de permisos: fila ADMIN activa en CS_PERMISO_USUARIO. */
export function canManagePermisos(user: AuthUser | null | undefined): boolean {
  const codes = user?.permisosCs ?? []
  return hasCode(codes, PERMISO_CS_ADMIN)
}

/** Registrar solicitudes de compra (solo crear/editar en borrador planeada). */
export function canRegistrarSolicitudCompra(user: AuthUser | null | undefined): boolean {
  const codes = user?.permisosCs ?? []
  if (hasCode(codes, PERMISO_CS_ADMIN)) return true
  if (hasCode(codes, PERMISO_CS_APROBAR_SOLICITUD)) return true
  return hasCode(codes, PERMISO_CS_REGISTRAR_SOLICITUD)
}

/** Aprobar o rechazar solicitudes planeadas. */
export function canAprobarSolicitudCompra(user: AuthUser | null | undefined): boolean {
  const codes = user?.permisosCs ?? []
  return hasCode(codes, PERMISO_CS_ADMIN) || hasCode(codes, PERMISO_CS_APROBAR_SOLICITUD)
}

/** Aprobar OC: APROBAR_OC activo o rol ADMIN. */
export function canAprobarOrdenCompra(user: AuthUser | null | undefined): boolean {
  const codes = user?.permisosCs ?? []
  return hasCode(codes, PERMISO_CS_ADMIN) || hasCode(codes, PERMISO_CS_APROBAR_OC)
}
