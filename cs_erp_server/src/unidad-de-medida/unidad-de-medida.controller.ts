import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { PaginationDto } from '../common/dto/pagination.dto'
import { CreateUnidadDeMedidaDto } from './dto/create-unidad-de-medida.dto'
import { UpdateUnidadDeMedidaDto } from './dto/update-unidad-de-medida.dto'
import { UnidadDeMedidaService } from './unidad-de-medida.service'

@Controller('unidad-de-medida')
export class UnidadDeMedidaController {
  constructor(
    private readonly unidadDeMedidaService: UnidadDeMedidaService,
  ) {}

  @Post()
  create(@Body() createUnidadDeMedidaDto: CreateUnidadDeMedidaDto) {
    return this.unidadDeMedidaService.create(createUnidadDeMedidaDto)
  }

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('q') q?: string,
  ) {
    return this.unidadDeMedidaService.findAll({ ...paginationDto, q })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unidadDeMedidaService.findOne(decodeURIComponent(id))
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUnidadDeMedidaDto: UpdateUnidadDeMedidaDto,
  ) {
    return this.unidadDeMedidaService.update(
      decodeURIComponent(id),
      updateUnidadDeMedidaDto,
    )
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unidadDeMedidaService.remove(decodeURIComponent(id))
  }
}
