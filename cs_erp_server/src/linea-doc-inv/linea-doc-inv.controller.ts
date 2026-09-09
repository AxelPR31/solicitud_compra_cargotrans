import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { PaginationDto } from '../common/dto/pagination.dto'
import { CreateLineaDocInvDto } from './dto/create-linea-doc-inv.dto'
import { UpdateLineaDocInvDto } from './dto/update-linea-doc-inv.dto'
import { LineaDocInvService } from './linea-doc-inv.service'
import { AuthGuard } from '../core/guards/auth.guard'

//@UseGuards(AuthGuard)
@Controller('linea-doc-inv')
export class LineaDocInvController {
  constructor(private readonly lineaDocInvService: LineaDocInvService) {}

  @Post()
  create(@Body() createLineaDocInvDto: CreateLineaDocInvDto) {
    return this.lineaDocInvService.create(createLineaDocInvDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.lineaDocInvService.findAll(paginationDto)
  }

  @Get(':paqueteInventario/:documentoInv/:lineaDocInv')
  findOne(
    @Param('paqueteInventario') paqueteInventario: string,
    @Param('documentoInv') documentoInv: string,
    @Param('lineaDocInv') lineaDocInv: string,
  ) {
    return this.lineaDocInvService.findOne(
      decodeURIComponent(paqueteInventario),
      decodeURIComponent(documentoInv),
      +lineaDocInv,
    )
  }

  @Patch(':paqueteInventario/:documentoInv/:lineaDocInv')
  update(
    @Param('paqueteInventario') paqueteInventario: string,
    @Param('documentoInv') documentoInv: string,
    @Param('lineaDocInv') lineaDocInv: string,
    @Body() updateLineaDocInvDto: UpdateLineaDocInvDto,
  ) {
    return this.lineaDocInvService.update(
      decodeURIComponent(paqueteInventario),
      decodeURIComponent(documentoInv),
      +lineaDocInv,
      updateLineaDocInvDto,
    )
  }

  @Delete(':paqueteInventario/:documentoInv/:lineaDocInv')
  remove(
    @Param('paqueteInventario') paqueteInventario: string,
    @Param('documentoInv') documentoInv: string,
    @Param('lineaDocInv') lineaDocInv: string,
  ) {
    return this.lineaDocInvService.remove(
      decodeURIComponent(paqueteInventario),
      decodeURIComponent(documentoInv),
      +lineaDocInv,
    )
  }

  @Delete(':paqueteInventario/:documentoInv')
  removeAll(
    @Param('paqueteInventario') paqueteInventario: string,
    @Param('documentoInv') documentoInv: string,
  ) {
    return this.lineaDocInvService.removeAll(
      decodeURIComponent(paqueteInventario),
      decodeURIComponent(documentoInv),
    )
  }
}
