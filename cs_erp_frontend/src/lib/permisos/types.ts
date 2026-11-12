import type { PermisoCsCodigo } from './codigos'

export type PermisoCodigo = PermisoCsCodigo

export type PermisoUsuarioRow = {
  usuario: string
  nombre: string
  admin: boolean
  registrarSolicitud: boolean
  aprobarSolicitud: boolean
  aprobarOc: boolean
}

export type PermisosListResponse = {
  items: PermisoUsuarioRow[]
}

export type SetPermisoPayload = {
  usuario: string
  permiso: PermisoCodigo
  activo: boolean
}

export type PermisoMatrixFieldKey =
  | 'admin'
  | 'registrarSolicitud'
  | 'aprobarSolicitud'
  | 'aprobarOc'
