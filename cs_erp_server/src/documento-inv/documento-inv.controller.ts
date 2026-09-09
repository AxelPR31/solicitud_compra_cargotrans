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
import { CreateDocumentoInvDto } from './dto/create-documento-inv.dto'
import { UpdateDocumentoInvDto } from './dto/update-documento-inv.dto'
import { DocumentoInvService } from './documento-inv.service'
import { AuthGuard } from '../core/guards/auth.guard'

//@UseGuards(AuthGuard)
@Controller('documento-inv')
export class DocumentoInvController {
  constructor(private readonly documentoInvService: DocumentoInvService) {}

  @Post()
  create(@Body() createDocumentoInvDto: CreateDocumentoInvDto) {
    return this.documentoInvService.create(createDocumentoInvDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.documentoInvService.findAll(paginationDto)
  }

  @Get(':paqueteInventario/:documentoInv')
  findOne(
    @Param('paqueteInventario') paqueteInventario: string,
    @Param('documentoInv') documentoInv: string,
  ) {
    return this.documentoInvService.findOne(
      decodeURIComponent(paqueteInventario),
      decodeURIComponent(documentoInv),
    )
  }

  @Patch(':paqueteInventario/:documentoInv')
  update(
    @Param('paqueteInventario') paqueteInventario: string,
    @Param('documentoInv') documentoInv: string,
    @Body() updateDocumentoInvDto: UpdateDocumentoInvDto,
  ) {
    return this.documentoInvService.update(
      decodeURIComponent(paqueteInventario),
      decodeURIComponent(documentoInv),
      updateDocumentoInvDto,
    )
  }

  @Delete(':paqueteInventario/:documentoInv')
  remove(
    @Param('paqueteInventario') paqueteInventario: string,
    @Param('documentoInv') documentoInv: string,
  ) {
    return this.documentoInvService.remove(
      decodeURIComponent(paqueteInventario),
      decodeURIComponent(documentoInv),
    )
  }
}
