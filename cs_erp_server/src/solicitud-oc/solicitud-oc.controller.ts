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
import { PaginationDto } from '../common/dto/pagination.dto'

@Controller('solicitud-oc')
export class SolicitudOcController {
  constructor(private readonly solicitudOcService: SolicitudOcService) {}

  @Post()
  create(@Body() createDto: CreateSolicitudOcDto) {
    return this.solicitudOcService.create(createDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.solicitudOcService.findAll(paginationDto)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.solicitudOcService.findOne(decodeURIComponent(id))
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateSolicitudOcDto) {
    return this.solicitudOcService.update(decodeURIComponent(id), updateDto)
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @Body() body: { usuario?: string }) {
    return this.solicitudOcService.cancel(
      decodeURIComponent(id),
      body?.usuario || 'ERPADMIN',
    )
  }
}
