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
import { RetencionesService } from './retenciones.service'
import { CreateRetencionDto } from './dto/create-retencion.dto'
import { UpdateRetencionDto } from './dto/update-retencion.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'

import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('retenciones')
export class RetencionesController {
  constructor(private readonly retencionesService: RetencionesService) {}

  @Post()
  @ApiBody({
    type: CreateRetencionDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          codigoRetencion: 'COD-001',
          descripcion: 'Descripcion de ejemplo',
          cuentaRetencion: '1-01-001-0001',
          porcentaje: 1000.5,
        },
      },
    },
  })
  create(@Body() createRetencionDto: CreateRetencionDto) {
    return this.retencionesService.create(createRetencionDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.retencionesService.findAll(paginationDto)
  }

  @Get(':codigoRetencion')
  findOne(@Param('codigoRetencion') codigoRetencion: string) {
    return this.retencionesService.findOne(decodeURIComponent(codigoRetencion))
  }

  @Patch(':codigoRetencion')
  @ApiBody({
    type: UpdateRetencionDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          codigoRetencion: 'COD-002',
          descripcion: 'Descripcion actualizada',
          cuentaRetencion: '1-01-001-0002',
          porcentaje: 150.75,
        },
      },
    },
  })
  update(
    @Param('codigoRetencion') codigoRetencion: string,
    @Body() updateRetencionDto: UpdateRetencionDto,
  ) {
    return this.retencionesService.update(
      decodeURIComponent(codigoRetencion),
      updateRetencionDto,
    )
  }

  @Delete(':codigoRetencion')
  remove(@Param('codigoRetencion') codigoRetencion: string) {
    return this.retencionesService.remove(decodeURIComponent(codigoRetencion))
  }
}
