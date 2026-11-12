export const PERMISO_ADMIN = 'ADMIN' as const
export const PERMISO_REGISTRAR_SOLICITUD = 'REGISTRAR_SOLICITUD' as const
export const PERMISO_APROBAR_SOLICITUD = 'APROBAR_SOLICITUD' as const
export const PERMISO_APROBAR_OC = 'APROBAR_OC' as const

export const PERMISOS_CONFIGURABLES = [
  PERMISO_ADMIN,
  PERMISO_REGISTRAR_SOLICITUD,
  PERMISO_APROBAR_SOLICITUD,
  PERMISO_APROBAR_OC,
] as const

/** Al activar ADMIN se activan también estos permisos de operación. */
export const PERMISOS_AUTO_CON_ADMIN = [
  PERMISO_REGISTRAR_SOLICITUD,
  PERMISO_APROBAR_SOLICITUD,
  PERMISO_APROBAR_OC,
] as const

export type PermisoConfigurable = (typeof PERMISOS_CONFIGURABLES)[number]
