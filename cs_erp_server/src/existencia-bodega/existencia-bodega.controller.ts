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
import { ApiBody } from '@nestjs/swagger'
import { PaginationDto } from '../common/dto/pagination.dto'
import { CreateExistenciaBodegaDto } from './dto/create-existencia-bodega.dto'
import { UpdateExistenciaBodegaDto } from './dto/update-existencia-bodega.dto'
import { ExistenciaBodegaService } from './existencia-bodega.service'

@Controller('existencia-bodega')
export class ExistenciaBodegaController {
  constructor(private readonly existenciaBodegaService: ExistenciaBodegaService) {}

  @Post()
  @ApiBody({
    type: CreateExistenciaBodegaDto,
    examples: {
      default: {
        summary: 'Crear existencia bodega',
        value: {
          articulo: 'ART001',
          bodega: 'BOD01',
          existenciaMinima: 10,
          existenciaMaxima: 100,
          cantDisponible: 50,
        },
      },
    },
  })
  create(@Body() dto: CreateExistenciaBodegaDto) {
    return this.existenciaBodegaService.create(dto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto & { q?: string }) {
    return this.existenciaBodegaService.findAll(paginationDto)
  }

  @Get(':articulo/:bodega')
  findOne(
    @Param('articulo') articulo: string,
    @Param('bodega') bodega: string,
  ) {
    return this.existenciaBodegaService.findOne({
      articulo: decodeURIComponent(articulo),
      bodega: decodeURIComponent(bodega),
    })
  }

  @Patch(':articulo/:bodega')
  @ApiBody({
    type: UpdateExistenciaBodegaDto,
    examples: {
      default: {
        summary: 'Actualizar existencia bodega',
        value: {
          existenciaMinima: 15,
          existenciaMaxima: 120,
        },
      },
    },
  })
  update(
    @Param('articulo') articulo: string,
    @Param('bodega') bodega: string,
    @Body() dto: UpdateExistenciaBodegaDto,
  ) {
    return this.existenciaBodegaService.update(
      {
        articulo: decodeURIComponent(articulo),
        bodega: decodeURIComponent(bodega),
      },
      dto,
    )
  }

  @Delete(':articulo/:bodega')
  remove(
    @Param('articulo') articulo: string,
    @Param('bodega') bodega: string,
  ) {
    return this.existenciaBodegaService.remove({
      articulo: decodeURIComponent(articulo),
      bodega: decodeURIComponent(bodega),
    })
  }
}
