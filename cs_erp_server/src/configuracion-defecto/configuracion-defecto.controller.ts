import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { ApiBody } from '@nestjs/swagger'
import { CreateConfiguracionDefectoDto } from './dto/create-configuracion-defecto.dto'
import { UpdateConfiguracionDefectoDto } from './dto/update-configuracion-defecto.dto'
import { ConfiguracionDefectoService } from './configuracion-defecto.service'

@Controller('configuracion-defecto')
export class ConfiguracionDefectoController {
  constructor(private readonly configuracionDefectoService: ConfiguracionDefectoService) {}

  @Post()
  @ApiBody({
    type: CreateConfiguracionDefectoDto,
    examples: {
      default: {
        summary: 'Crear configuración por defecto',
        value: {
          tipo: 'ORDEN_PRODUCCION',
          centroCosto: '01-01-00',
          cuentaContable: '1-01-001-0001',
        },
      },
    },
  })
  create(@Body() dto: CreateConfiguracionDefectoDto) {
    return this.configuracionDefectoService.create(dto)
  }

  @Get()
  findAll() {
    return this.configuracionDefectoService.findAll()
  }

  @Get(':tipo')
  findOne(@Param('tipo') tipo: string) {
    return this.configuracionDefectoService.findOne(decodeURIComponent(tipo))
  }

  @Patch(':tipo')
  @ApiBody({
    type: UpdateConfiguracionDefectoDto,
    examples: {
      default: {
        summary: 'Actualizar configuración por defecto',
        value: {
          centroCosto: '02-02-00',
          cuentaContable: '2-01-002-0002',
        },
      },
    },
  })
  update(
    @Param('tipo') tipo: string,
    @Body() dto: UpdateConfiguracionDefectoDto,
  ) {
    return this.configuracionDefectoService.update(decodeURIComponent(tipo), dto)
  }

  @Delete(':tipo')
  remove(@Param('tipo') tipo: string) {
    return this.configuracionDefectoService.remove(decodeURIComponent(tipo))
  }
}
