import { Controller, Get, Param } from '@nestjs/common'
import { UsuarioSoftlandService } from './usuario-softland.service'

@Controller('usuario-softland')
export class UsuarioSoftlandController {
  constructor(private readonly usuarioSoftlandService: UsuarioSoftlandService) {}

  @Get(':usuario')
  findNombre(@Param('usuario') usuario: string) {
    return this.usuarioSoftlandService.findNombre(decodeURIComponent(usuario))
  }
}
