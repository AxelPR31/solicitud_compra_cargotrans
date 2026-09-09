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
import { AsientoMayorizadoService } from './asiento-mayorizado.service'
import { CreateAsientoMayorizadoDto } from './dto/create-asiento-mayorizado.dto'
import { UpdateAsientoMayorizadoDto } from './dto/update-asiento-mayorizado.dto'

import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('asiento-mayorizado')
export class AsientoMayorizadoController {
  constructor(
    private readonly asientoMayorizadoService: AsientoMayorizadoService,
  ) {}

  @Post()
  @ApiBody({
    type: CreateAsientoMayorizadoDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          asiento: '0000000001',
          mayorAuditoria: 1,
          tipoAsiento: 'DIAR',
          fecha: new Date().toISOString(),
          contabilidad: 'F',
          origen: 'CB',
          claseAsiento: 'N',
          ultimoUsuario: 'usuario-ejemplo',
          montoTotalLocal: 0,
          montoTotalDolar: 0,
          notas: null,
          usuarioCreacion: 'usuario-ejemplo',
          exportado: 'N',
          tipoIngresoMayor: 'M',
        },
      },
    },
  })
  create(@Body() createAsientoMayorizadoDto: CreateAsientoMayorizadoDto) {
    return this.asientoMayorizadoService.create(createAsientoMayorizadoDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.asientoMayorizadoService.findAll(paginationDto)
  }

  @Get(':asiento')
  findOne(@Param('asiento') asiento: string) {
    return this.asientoMayorizadoService.findOne(asiento)
  }

  @Patch(':asiento')
  @ApiBody({
    type: UpdateAsientoMayorizadoDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          notas: 'Notas actualizadas',
          exportado: 'S',
        },
      },
    },
  })
  update(
    @Param('asiento') asiento: string,
    @Body() updateAsientoMayorizadoDto: UpdateAsientoMayorizadoDto,
  ) {
    return this.asientoMayorizadoService.update(
      asiento,
      updateAsientoMayorizadoDto,
    )
  }

  @Delete(':asiento')
  remove(@Param('asiento') asiento: string) {
    return this.asientoMayorizadoService.remove(asiento)
  }
}

