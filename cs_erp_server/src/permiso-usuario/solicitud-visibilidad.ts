import { UserPrincipal } from '../auth/types/user-principal'
import { PERMISO_ADMIN, PERMISO_APROBAR_SOLICITUD } from './permiso-usuario.constants'

const SIN_SESION = '\u0000SIN_SESION'

/**
 * `null` = puede ver todas las solicitudes (ADMIN o APROBAR_SOLICITUD).
 * string = solo las creadas por ese usuario (en mayúsculas, sin espacios).
 */
export function usuarioRestringidoSolicitudes(user?: UserPrincipal): string | null {
  const permisos = new Set((user?.permisosCs ?? []).map(p => p.trim().toUpperCase()))
  if (permisos.has(PERMISO_ADMIN) || permisos.has(PERMISO_APROBAR_SOLICITUD)) {
    return null
  }
  const usuario = user?.usuario?.trim().toUpperCase()
  return usuario || SIN_SESION
}

export function esSolicitudDeUsuario(creador: string | null | undefined, soloUsuario: string): boolean {
  return (creador ?? '').trim().toUpperCase() === soloUsuario
}
