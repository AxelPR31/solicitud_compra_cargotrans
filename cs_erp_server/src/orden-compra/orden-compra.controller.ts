import { Controller, Get, Param, Post, Query } from '@nestjs/common'
import { OrdenCompraService } from './orden-compra.service'
import { FindOrdenCompraDto } from './dto/find-orden-compra.dto'
import { User } from '../core/decorators/user.decorator'
import { UserPrincipal } from '../auth/types/user-principal'

@Controller('orden-compra')
export class OrdenCompraController {
  constructor(private readonly ordenCompraService: OrdenCompraService) {}

  @Get()
  findAll(@Query() query: FindOrdenCompraDto) {
    return this.ordenCompraService.findAll(query)
  }

  @Get(':ordenCompra')
  findOne(@Param('ordenCompra') ordenCompra: string) {
    return this.ordenCompraService.findOne(decodeURIComponent(ordenCompra))
  }

  @Post(':ordenCompra/aprobar')
  aprobar(@Param('ordenCompra') ordenCompra: string, @User() user: UserPrincipal) {
    const usuario = user?.usuario || 'ERPADMIN'
    return this.ordenCompraService.aprobar(decodeURIComponent(ordenCompra), usuario)
  }
}
