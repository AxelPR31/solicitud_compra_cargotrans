import { z } from 'zod'

export interface AuthUser {
  usuario: string
  idUser: number
  nombre: string
  tipoUsuario: string
  idCliente?: string
  caja?: string
  canViewOtherCashiers?: boolean
  /** Permisos activos en CS_PERMISO_USUARIO */
  permisosCs?: string[]
  consecutivo?: string
  permisoTotal?: boolean
  esConsulta?: boolean
}

export const signInSchema = z.object({
  usuario: z.string().min(1, 'El usuario es requerido'),
  contrasena: z.string().min(1, 'La contraseña es requerida'),
})

export type SignInDto = z.infer<typeof signInSchema>
