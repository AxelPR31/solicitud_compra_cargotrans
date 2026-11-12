import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { PermisoUsuarioService } from './permiso-usuario.service'
import { User } from '../core/decorators/user.decorator'
import { UserPrincipal } from '../auth/types/user-principal'
import { SetPermisoDto } from './dto/set-permiso.dto'
import { AuthGuard } from '../core/guards/auth.guard'

@Controller('permiso-usuario')
@UseGuards(AuthGuard)
export class PermisoUsuarioController {
  constructor(private readonly permisoUsuarioService: PermisoUsuarioService) {}

  private actorFrom(@User() user: UserPrincipal, req: Request): UserPrincipal {
    return user ?? ((req as Request & { user?: UserPrincipal }).user as UserPrincipal)
  }

  @Get()
  list(@User() user: UserPrincipal, @Req() req: Request) {
    return this.permisoUsuarioService.listMatrix(this.actorFrom(user, req))
  }

  @Patch()
  set(
    @User() user: UserPrincipal,
    @Req() req: Request,
    @Body() dto: SetPermisoDto,
  ) {
    const actor = this.actorFrom(user, req)
    return this.permisoUsuarioService.setPermiso(
      actor,
      dto.usuario,
      dto.permiso,
      dto.activo,
    )
  }
}
