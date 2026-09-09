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
import { DiarioService } from './diario.service'
import { CreateDiarioDto } from './dto/create-diario.dto'
import { UpdateDiarioDto } from './dto/update-diario.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'

import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('diario')
export class DiarioController {
  constructor(private readonly diarioService: DiarioService) {}

  @Post()
  @ApiBody({
    type: CreateDiarioDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          asiento: 'AJ-2026-000001',
          consecutivo: 1,
          centroCosto: 'centroCosto_ejemplo',
          cuentaContable: '6-01-001-0001',
          fuente: 'fuente_ejemplo',
          referencia: 'REF-0001',
          debitoLocal: 1,
          debitoDolar: 1,
          creditoLocal: 1,
          creditoDolar: 1,
        },
      },
    },
  })
  create(@Body() createDiarioDto: CreateDiarioDto) {
    return this.diarioService.create(createDiarioDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.diarioService.findAll(paginationDto)
  }

  @Get(':asiento-:consecutivo')
  findOne(
    @Param('asiento') asiento: string,
    @Param('consecutivo') consecutivo: number,
  ) {
    return this.diarioService.findOne(decodeURIComponent(asiento), consecutivo)
  }

  @Patch(':asiento-:consecutivo')
  @ApiBody({
    type: UpdateDiarioDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          asiento: 'AJ-2026-000001',
          consecutivo: 2,
          centroCosto: 'centroCosto_actualizado',
        },
      },
    },
  })
  update(
    @Param('asiento') asiento: string,
    @Param('consecutivo') consecutivo: number,
    @Body() updateDiarioDto: UpdateDiarioDto,
  ) {
    return this.diarioService.update(
      decodeURIComponent(asiento),
      consecutivo,
      updateDiarioDto,
    )
  }

  @Delete(':asiento-:consecutivo')
  remove(
    @Param('asiento') asiento: string,
    @Param('consecutivo') consecutivo: number,
  ) {
    return this.diarioService.remove(decodeURIComponent(asiento), consecutivo)
  }
}
