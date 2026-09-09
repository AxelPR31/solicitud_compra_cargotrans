import { Controller, Get, Param } from '@nestjs/common'
import { ArticuloCuentaService } from './articulo-cuenta.service'

@Controller('articulo-cuenta')
export class ArticuloCuentaController {
  constructor(private readonly articuloCuentaService: ArticuloCuentaService) {}

  @Get('por-articulo/:articulo')
  resolverPorArticulo(@Param('articulo') articulo: string) {
    return this.articuloCuentaService.resolverPorArticulo(decodeURIComponent(articulo))
  }

  @Get(':codigo')
  findOne(@Param('codigo') codigo: string) {
    return this.articuloCuentaService.findOne(decodeURIComponent(codigo))
  }
}
