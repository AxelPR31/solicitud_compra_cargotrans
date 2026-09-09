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
import { ConfiguracionMonedaService } from './configuracion-moneda.service'
import { CreateConfiguracionMonedaDto } from './dto/create-configuracion-moneda.dto'
import { UpdateConfiguracionMonedaDto } from './dto/update-configuracion-moneda.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'

import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('configuracion-moneda')
export class ConfiguracionMonedaController {
  constructor(
    private readonly configuracionMonedaService: ConfiguracionMonedaService,
  ) {}

  @Post()
  @ApiBody({
    type: CreateConfiguracionMonedaDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          monedaLocal: 'monedaLocal_ejemplo',
          monedaDolar: 'monedaDolar_ejemplo',
          simboloLocal: 'simboloLocal_ejemplo',
          simboloDolar: 'simboloDolar_ejemplo',
        },
      },
    },
  })
  create(@Body() createConfiguracionMonedaDto: CreateConfiguracionMonedaDto) {
    return this.configuracionMonedaService.create(createConfiguracionMonedaDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.configuracionMonedaService.findAll(paginationDto)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.configuracionMonedaService.findOne(+id)
  }

  @Patch(':id')
  @ApiBody({
    type: UpdateConfiguracionMonedaDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          monedaLocal: 'monedaLocal_actualizado',
          monedaDolar: 'monedaDolar_actualizado',
          simboloLocal: 'simboloLocal_actualizado',
        },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateConfiguracionMonedaDto: UpdateConfiguracionMonedaDto,
  ) {
    return this.configuracionMonedaService.update(
      +id,
      updateConfiguracionMonedaDto,
    )
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.configuracionMonedaService.remove(+id)
  }
}
