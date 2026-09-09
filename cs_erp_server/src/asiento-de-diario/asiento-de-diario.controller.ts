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
import { AsientoDeDiarioService } from './asiento-de-diario.service'
import { CreateAsientoDeDiarioDto } from './dto/create-asiento-de-diario.dto'
import { UpdateAsientoDeDiarioDto } from './dto/update-asiento-de-diario.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'

import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('asiento-de-diario')
export class AsientoDeDiarioController {
  constructor(
    private readonly asientoDeDiarioService: AsientoDeDiarioService,
  ) {}

  @Post()
  @ApiBody({
    type: CreateAsientoDeDiarioDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          asiento: 'AJ-2026-000001',
          paquete: 'paquete_ejemplo',
          tipoAsiento: 'GEN',
          fecha: '2026-04-20T00:00:00.000Z',
          contabilidad: 'contabilidad_ejemplo',
          origen: 'origen_ejemplo',
          totalDebitoLoc: 1000.5,
          totalCreditoDol: 1000.5,
          totalCreditoLoc: 1000.5,
        },
      },
    },
  })
  create(@Body() createAsientoDeDiarioDto: CreateAsientoDeDiarioDto) {
    return this.asientoDeDiarioService.create(createAsientoDeDiarioDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.asientoDeDiarioService.findAll(paginationDto)
  }

  @Get(':asiento')
  findOne(@Param('asiento') asiento: string) {
    return this.asientoDeDiarioService.findOne(decodeURIComponent(asiento))
  }

  @Get(':asiento/diario')
  findWithDiario(@Param('asiento') asiento: string) {
    return this.asientoDeDiarioService.findWithDiario(
      decodeURIComponent(asiento),
    )
  }

  @Patch(':asiento')
  @ApiBody({
    type: UpdateAsientoDeDiarioDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          asiento: 'AJ-2026-000001',
          paquete: 'paquete_actualizado',
          tipoAsiento: 'GEN',
        },
      },
    },
  })
  update(
    @Param('asiento') asiento: string,
    @Body() updateAsientoDeDiarioDto: UpdateAsientoDeDiarioDto,
  ) {
    return this.asientoDeDiarioService.update(
      decodeURIComponent(asiento),
      updateAsientoDeDiarioDto,
    )
  }

  @Delete(':asiento')
  remove(@Param('asiento') asiento: string) {
    return this.asientoDeDiarioService.remove(decodeURIComponent(asiento))
  }
}

