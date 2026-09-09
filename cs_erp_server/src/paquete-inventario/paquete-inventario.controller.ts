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
import { PaginationDto } from '../common/dto/pagination.dto'
import { CreatePaqueteInventarioDto } from './dto/create-paquete-inventario.dto'
import { UpdatePaqueteInventarioDto } from './dto/update-paquete-inventario.dto'
import { PaqueteInventarioService } from './paquete-inventario.service'
import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('paquete-inventario')
export class PaqueteInventarioController {
  constructor(
    private readonly paqueteInventarioService: PaqueteInventarioService,
  ) {}

  @Post()
  create(@Body() createPaqueteInventarioDto: CreatePaqueteInventarioDto) {
    return this.paqueteInventarioService.create(createPaqueteInventarioDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.paqueteInventarioService.findAll(paginationDto)
  }

  @Get(':paqueteInventario')
  findOne(@Param('paqueteInventario') paqueteInventario: string) {
    return this.paqueteInventarioService.findOne(
      decodeURIComponent(paqueteInventario),
    )
  }

  @Patch(':paqueteInventario')
  update(
    @Param('paqueteInventario') paqueteInventario: string,
    @Body() updatePaqueteInventarioDto: UpdatePaqueteInventarioDto,
  ) {
    return this.paqueteInventarioService.update(
      decodeURIComponent(paqueteInventario),
      updatePaqueteInventarioDto,
    )
  }

  @Delete(':paqueteInventario')
  remove(@Param('paqueteInventario') paqueteInventario: string) {
    return this.paqueteInventarioService.remove(
      decodeURIComponent(paqueteInventario),
    )
  }
}
