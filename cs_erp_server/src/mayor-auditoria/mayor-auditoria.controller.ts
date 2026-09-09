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
import { ApiBody } from '@nestjs/swagger'
import { PaginationDto } from '../common/dto/pagination.dto'
import { CreateMayorAuditoriaDto } from './dto/create-mayor-auditoria.dto'
import { UpdateMayorAuditoriaDto } from './dto/update-mayor-auditoria.dto'
import { MayorAuditoriaService } from './mayor-auditoria.service'

import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('mayor-auditoria')
export class MayorAuditoriaController {
  constructor(private readonly mayorAuditoriaService: MayorAuditoriaService) {}

  @Post()
  @ApiBody({
    type: CreateMayorAuditoriaDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          usuario: 'usuario-ejemplo',
          fecha: new Date().toISOString(),
          comentario: 'Comentario de ejemplo',
        },
      },
    },
  })
  create(@Body() createMayorAuditoriaDto: CreateMayorAuditoriaDto) {
    return this.mayorAuditoriaService.create(createMayorAuditoriaDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.mayorAuditoriaService.findAll(paginationDto)
  }

  @Get(':mayorAuditoria')
  findOne(@Param('mayorAuditoria') mayorAuditoria: string) {
    return this.mayorAuditoriaService.findOne(+mayorAuditoria)
  }

  @Patch(':mayorAuditoria')
  @ApiBody({
    type: UpdateMayorAuditoriaDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          comentario: 'Comentario actualizado',
        },
      },
    },
  })
  update(
    @Param('mayorAuditoria') mayorAuditoria: string,
    @Body() updateMayorAuditoriaDto: UpdateMayorAuditoriaDto,
  ) {
    return this.mayorAuditoriaService.update(
      +mayorAuditoria,
      updateMayorAuditoriaDto,
    )
  }

  @Delete(':mayorAuditoria')
  remove(@Param('mayorAuditoria') mayorAuditoria: string) {
    return this.mayorAuditoriaService.remove(+mayorAuditoria)
  }
}

