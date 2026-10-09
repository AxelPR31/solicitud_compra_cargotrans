import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { CsSolicitudOcService } from './cs-solicitud-oc.service'
import { CreateSolicitudOcDto } from '../solicitud-oc/dto/create-solicitud-oc.dto'
import { UpdateSolicitudOcDto } from '../solicitud-oc/dto/update-solicitud-oc.dto'
import { FindCsSolicitudOcDto } from './dto/find-cs-solicitud-oc.dto'
import { RechazarCsSolicitudOcDto } from './dto/rechazar-cs-solicitud-oc.dto'
import { User } from '../core/decorators/user.decorator'
import { UserPrincipal } from '../auth/types/user-principal'

@Controller('cs-solicitud-oc')
export class CsSolicitudOcController {
  constructor(private readonly csSolicitudOcService: CsSolicitudOcService) {}

  @Post()
  create(@Body() createDto: CreateSolicitudOcDto) {
    return this.csSolicitudOcService.create(createDto)
  }

  @Get()
  findAll(@Query() query: FindCsSolicitudOcDto) {
    return this.csSolicitudOcService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.csSolicitudOcService.findOne(id)
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSolicitudOcDto,
  ) {
    return this.csSolicitudOcService.update(id, updateDto)
  }

  @Post(':id/aprobar')
  aprobar(@Param('id', ParseIntPipe) id: number, @User() user: UserPrincipal) {
    const usuario = user?.usuario || 'ERPADMIN'
    return this.csSolicitudOcService.aprobar(id, usuario)
  }

  @Post(':id/rechazar')
  rechazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RechazarCsSolicitudOcDto,
    @User() user: UserPrincipal,
  ) {
    const usuario = user?.usuario || 'ERPADMIN'
    return this.csSolicitudOcService.rechazar(id, usuario, body?.motivo)
  }
}
