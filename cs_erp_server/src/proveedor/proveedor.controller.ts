import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common'
import { ApiBody } from '@nestjs/swagger'
import { ProveedorService } from './proveedor.service'
import { CreateProveedorDto } from './dto/create-proveedor.dto'
import { UpdateProveedorDto } from './dto/update-proveedor.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('proveedor')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Post()
  @ApiBody({
    type: CreateProveedorDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          proveedor: 'PRV-0001',
          nombre: 'Proveedor de ejemplo',
          contacto: 'Juan Perez',
          cargo: 'Gerente',
          direccion: 'Managua, Nicaragua',
          fechaIngreso: '2026-05-05T00:00:00.000Z',
          fechaUltMov: '2026-05-05T00:00:00.000Z',
          telefono1: '2222-2222',
          telefono2: '8888-8888',
          fax: '0000-0000',
          ordenMinima: 0,
          descuento: 0,
          local: 'N',
          congelado: 'N',
          contribuyente: '0000000000001',
          condicionPago: 'CONT',
          moneda: 'NIO',
          pais: 'NIC',
          categoriaProveed: 'GENERAL',
          multimoneda: 'N',
          saldo: 0,
          saldoLocal: 0,
          saldoDolar: 0,
          activo: 'S',
        },
      },
    },
  })
  create(@Body() createProveedorDto: CreateProveedorDto) {
    return this.proveedorService.create(createProveedorDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.proveedorService.findAll(paginationDto)
  }

  @Get(':proveedor')
  findOne(@Param('proveedor') proveedor: string) {
    return this.proveedorService.findOne(decodeURIComponent(proveedor))
  }

  @Patch(':proveedor')
  @ApiBody({
    type: UpdateProveedorDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          nombre: 'Proveedor actualizado',
          contacto: 'Maria Lopez',
        },
      },
    },
  })
  update(
    @Param('proveedor') proveedor: string,
    @Body() updateProveedorDto: UpdateProveedorDto,
  ) {
    return this.proveedorService.update(
      decodeURIComponent(proveedor),
      updateProveedorDto,
    )
  }

  @Delete(':proveedor')
  remove(@Param('proveedor') proveedor: string) {
    return this.proveedorService.remove(decodeURIComponent(proveedor))
  }
}
