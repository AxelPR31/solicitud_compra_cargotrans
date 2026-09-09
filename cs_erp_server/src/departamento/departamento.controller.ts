import { Controller, Get, Param, Query } from '@nestjs/common'
import { DepartamentoService } from './departamento.service'
import { PaginationDto } from '../common/dto/pagination.dto'

@Controller('departamento')
export class DepartamentoController {
  constructor(private readonly departamentoService: DepartamentoService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto & { activo?: string }) {
    return this.departamentoService.findAll(paginationDto)
  }

  @Get(':departamento')
  findOne(@Param('departamento') departamento: string) {
    return this.departamentoService.findOne(decodeURIComponent(departamento))
  }
}
