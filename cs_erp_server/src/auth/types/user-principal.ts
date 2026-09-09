export interface UserPrincipal {
  usuario: string
  idUser: number
  nombre: string
  tipoUsuario: string
  idCliente: string
  caja: string
  canViewOtherCashiers: boolean
  isAdmin: boolean
  permisoTotal?: boolean
  esConsulta?: boolean
  consecutivo?: number
}

