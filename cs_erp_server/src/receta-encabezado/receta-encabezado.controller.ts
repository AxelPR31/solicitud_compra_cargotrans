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
import { CreateRecetaEncabezadoDto } from './dto/create-receta-encabezado.dto'
import { UpdateRecetaEncabezadoDto } from './dto/update-receta-encabezado.dto'
import { RecetaEncabezadoService } from './receta-encabezado.service'
import { AuthGuard } from '../core/guards/auth.guard'

//@UseGuards(AuthGuard)
@Controller('receta-encabezado')
export class RecetaEncabezadoController {
  constructor(
    private readonly recetaEncabezadoService: RecetaEncabezadoService,
  ) {}

  @Post()
  create(@Body() createRecetaEncabezadoDto: CreateRecetaEncabezadoDto) {
    return this.recetaEncabezadoService.create(createRecetaEncabezadoDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.recetaEncabezadoService.findAll(paginationDto)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recetaEncabezadoService.findOne(+id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecetaEncabezadoDto: UpdateRecetaEncabezadoDto,
  ) {
    return this.recetaEncabezadoService.update(+id, updateRecetaEncabezadoDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recetaEncabezadoService.remove(+id)
  }
}
