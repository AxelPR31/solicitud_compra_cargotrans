import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { ConsecutivoAppConsumoService } from './consecutivo-app-consumo.service'
import { TipoConsecutivo } from './entities/consecutivo-app-consumo.entity'

@Controller('consecutivo-app-consumo')
export class ConsecutivoAppConsumoController {
  constructor(private readonly service: ConsecutivoAppConsumoService) {}

  @Get(':tipo/siguiente')
  async getSiguientePreview(@Param('tipo') tipo: TipoConsecutivo) {
    const siguiente = await this.service.previewSiguiente(tipo)
    return { siguiente }
  }

  @Get()
  async findAll() {
    return this.service.findAll()
  }

  @Post()
  async create(@Body() body: any) {
    return this.service.create(body)
  }

  @Patch(':tipo')
  async update(@Param('tipo') tipo: TipoConsecutivo, @Body() body: any) {
    return this.service.update(tipo, body)
  }

  @Delete(':tipo')
  async remove(@Param('tipo') tipo: TipoConsecutivo) {
    return this.service.remove(tipo)
  }
}
