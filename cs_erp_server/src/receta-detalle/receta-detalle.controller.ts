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
import { CreateRecetaDetalleDto } from './dto/create-receta-detalle.dto'
import { UpdateRecetaDetalleDto } from './dto/update-receta-detalle.dto'
import { RecetaDetalleService } from './receta-detalle.service'
import { AuthGuard } from '../core/guards/auth.guard'

//@UseGuards(AuthGuard)
@Controller('receta-detalle')
export class RecetaDetalleController {
  constructor(private readonly recetaDetalleService: RecetaDetalleService) {}

  @Post()
  create(@Body() createRecetaDetalleDto: CreateRecetaDetalleDto) {
    return this.recetaDetalleService.create(createRecetaDetalleDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.recetaDetalleService.findAll(paginationDto)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recetaDetalleService.findOne(+id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecetaDetalleDto: UpdateRecetaDetalleDto,
  ) {
    return this.recetaDetalleService.update(+id, updateRecetaDetalleDto)
  }

  @Delete('by-receta/:recetaId')
  removeByRecetaId(@Param('recetaId') recetaId: string) {
    return this.recetaDetalleService.removeByRecetaId(+recetaId)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recetaDetalleService.remove(+id)
  }
}
