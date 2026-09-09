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
import { CreateBodegaDto } from './dto/create-bodega.dto'
import { UpdateBodegaDto } from './dto/update-bodega.dto'
import { BodegaService } from './bodega.service'
import { AuthGuard } from '../core/guards/auth.guard'

//@UseGuards(AuthGuard)
@Controller('bodega')
export class BodegaController {
  constructor(private readonly bodegaService: BodegaService) {}

  @Post()
  create(@Body() createBodegaDto: CreateBodegaDto) {
    return this.bodegaService.create(createBodegaDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto, @Query('q') q?: string) {
    return this.bodegaService.findAll(paginationDto, q)
  }

  @Get(':bodega')
  findOne(@Param('bodega') bodega: string) {
    return this.bodegaService.findOne(decodeURIComponent(bodega))
  }

  @Patch(':bodega')
  update(
    @Param('bodega') bodega: string,
    @Body() updateBodegaDto: UpdateBodegaDto,
  ) {
    return this.bodegaService.update(
      decodeURIComponent(bodega),
      updateBodegaDto,
    )
  }

  @Delete(':bodega')
  remove(@Param('bodega') bodega: string) {
    return this.bodegaService.remove(decodeURIComponent(bodega))
  }
}
