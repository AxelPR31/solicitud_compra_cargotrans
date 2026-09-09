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
import { TrasladoInternoService } from './traslado-interno.service'
import { CreateTrasladoInternoDto } from './dto/create-traslado-interno.dto'
import { UpdateTrasladoInternoDto } from './dto/update-traslado-interno.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

@Controller('traslado-interno')
export class TrasladoInternoController {
  constructor(private readonly service: TrasladoInternoService) {}

  @Post()
  create(@Body() createDto: CreateTrasladoInternoDto) {
    return this.service.create(createDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.service.findAll(paginationDto)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id)
  }

  @Post(':id/aprobar')
  aprobar(@Param('id') id: string, @Body('usuario') usuario?: string) {
    return this.service.aprobar(+id, usuario)
  }

  @Post(':id/rechazar')
  rechazar(@Param('id') id: string) {
    return this.service.rechazar(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateTrasladoInternoDto) {
    return this.service.update(+id, updateDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id)
  }
}
