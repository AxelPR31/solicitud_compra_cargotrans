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
import { CreateArticuloDto } from './dto/create-articulo.dto'
import { UpdateArticuloDto } from './dto/update-articulo.dto'
import { ArticuloService } from './articulo.service'
import { AuthGuard } from '../core/guards/auth.guard'

//@UseGuards(AuthGuard)
@Controller('articulo')
export class ArticuloController {
  constructor(private readonly articuloService: ArticuloService) {}

  @Post()
  create(@Body() createArticuloDto: CreateArticuloDto) {
    return this.articuloService.create(createArticuloDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.articuloService.findAll(paginationDto)
  }

  @Get(':articulo')
  findOne(@Param('articulo') articulo: string) {
    return this.articuloService.findOne(decodeURIComponent(articulo))
  }

  @Patch(':articulo')
  update(
    @Param('articulo') articulo: string,
    @Body() updateArticuloDto: UpdateArticuloDto,
  ) {
    return this.articuloService.update(
      decodeURIComponent(articulo),
      updateArticuloDto,
    )
  }

  @Delete(':articulo')
  remove(@Param('articulo') articulo: string) {
    return this.articuloService.remove(decodeURIComponent(articulo))
  }
}
