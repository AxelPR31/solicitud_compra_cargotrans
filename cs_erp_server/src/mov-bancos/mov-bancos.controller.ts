import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common'
import { MovBancosService } from './mov-bancos.service'
import { CreateMovBancoDto } from './dto/create-mov-banco.dto'
import { UpdateMovBancoDto } from './dto/update-mov-banco.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'
import { AuthGuard } from 'src/core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('mov-bancos')
export class MovBancosController {
  constructor(private readonly movBancosService: MovBancosService) {}

  @Post()
  @ApiBody({
    type: CreateMovBancoDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          cuentaBanco: '001-0023456-7',
          numero: 1,
          fecha: '2026-04-20T00:00:00.000Z',
          referencia: 'REF-0001',
          monto: 1000.5,
          tipocambio: 1,
          detalle: 'detalle_ejemplo',
          validado: 'validado_ejemplo',
          caja: 'caja_ejemplo',
          tipoDoc: 'GEN',
        },
      },
    },
  })
  create(@Body() createMovBancoDto: CreateMovBancoDto) {
    return this.movBancosService.create(createMovBancoDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.movBancosService.findAll(paginationDto)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.movBancosService.findOne(id)
  }

  @Get('asiento/:asiento')
  findOneByAsiento(@Param('asiento') asiento: string) {
    return this.movBancosService.findOne(asiento)
  }

  @Patch(':id')
  @ApiBody({
    type: UpdateMovBancoDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          cuentaBanco: '001-0023456-7',
          numero: 2,
          fecha: '2026-04-20T00:00:00.000Z',
        },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateMovBancoDto: UpdateMovBancoDto,
  ) {
    return this.movBancosService.update(+id, updateMovBancoDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.movBancosService.remove(+id)
  }
}

