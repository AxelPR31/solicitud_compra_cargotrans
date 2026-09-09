// import {
//   CanActivate,
//   ExecutionContext,
//   ForbiddenException,
//   Injectable,
// } from '@nestjs/common'
// import { UserPrincipal } from '../../auth/types/user-principal'

// @Injectable()
// export class PermisoTotalGuard implements CanActivate {
//   constructor() {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest()
//     const user = request.user as UserPrincipal | undefined
//     const usuario = (user?.usuario || '').trim()

//     if (!usuario) {
//       throw new ForbiddenException('Usuario no autenticado')
//     }

//     const tienePermiso =
//       await this.cbPermisoTotalService.usuarioTienePermisoTotal(usuario)
//     if (!tienePermiso) {
//       throw new ForbiddenException(
//         'Solo usuarios con permiso total pueden administrar usuarios de consulta',
//       )
//     }

//     return true
//   }
// }
