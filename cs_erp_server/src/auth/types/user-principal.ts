export interface UserPrincipal {
  usuario: string
  idUser: number
  nombre: string
  tipoUsuario: string
  idCliente: string
  caja: string
  canViewOtherCashiers: boolean
  /** Filas activas en CS_PERMISO_USUARIO (p. ej. ADMIN, APROBAR_OC). */
  permisosCs: string[]
  permisoTotal?: boolean
  esConsulta?: boolean
  consecutivo?: number
}

