import { PERMISOS_CONFIGURABLES } from './permiso-usuario.constants'

export const MENSAJE_SIN_PERMISO_SISTEMA = 'No tienes permisos para acceder a este sistema.'

/** Al menos un permiso del sistema. Sin ninguno, el usuario no puede usar el API (salvo /auth). */
export function tieneAlgunPermisoSistema(permisosCs?: string[]): boolean {
  const set = new Set((permisosCs ?? []).map(p => p.trim().toUpperCase()))
  return PERMISOS_CONFIGURABLES.some(codigo => set.has(codigo))
}
