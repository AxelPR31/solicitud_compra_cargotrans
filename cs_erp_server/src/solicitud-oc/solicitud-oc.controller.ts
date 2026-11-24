import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { SolicitudOcService } from './solicitud-oc.service'
import { CreateSolicitudOcDto } from './dto/create-solicitud-oc.dto'
import { UpdateSolicitudOcDto } from './dto/update-solicitud-oc.dto'
import { FindSolicitudOcDto } from './dto/find-solicitud-oc.dto'
import { User } from '../core/decorators/user.decorator'
import { UserPrincipal } from '../auth/types/user-principal'
import { usuarioRestringidoSolicitudes } from '../permiso-usuario/solicitud-visibilidad'

@Controller('solicitud-oc')
export class SolicitudOcController {
  constructor(private readonly solicitudOcService: SolicitudOcService) {}

  @Post()
  create(@Body() createDto: CreateSolicitudOcDto) {
    return this.solicitudOcService.create(createDto)
  }

  @Get()
  findAll(@Query() query: FindSolicitudOcDto, @User() user: UserPrincipal) {
    return this.solicitudOcService.findAll(query, usuarioRestringidoSolicitudes(user))
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user: UserPrincipal) {
    return this.solicitudOcService.findOne(
      decodeURIComponent(id),
      usuarioRestringidoSolicitudes(user),
    )
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSolicitudOcDto,
    @User() user: UserPrincipal,
  ) {
    return this.solicitudOcService.update(
      decodeURIComponent(id),
      updateDto,
      usuarioRestringidoSolicitudes(user),
    )
  }

  @Delete(':id')
  cancel(
    @Param('id') id: string,
    @Body() body: { usuario?: string },
    @User() user: UserPrincipal,
  ) {
    return this.solicitudOcService.cancel(
      decodeURIComponent(id),
      user?.usuario?.trim().toUpperCase() || body?.usuario || 'ERPADMIN',
      usuarioRestringidoSolicitudes(user),
    )
  }
}
