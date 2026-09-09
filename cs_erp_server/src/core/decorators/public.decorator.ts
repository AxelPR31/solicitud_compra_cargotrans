import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

/**
 * Marca un handler/controller como público (sin autenticación).
 * Usado por AuthGuard global para permitir rutas como /auth/signin.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

