import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ImpuestoService } from './impuesto.service'
import { CreateImpuestoDto } from './dto/create-impuesto.dto'
import { UpdateImpuestoDto } from './dto/update-impuesto.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'

import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('impuesto')
export class ImpuestoController {
  constructor(private readonly impuestoService: ImpuestoService) {}

  @Post()
  @ApiBody({
    type: CreateImpuestoDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          impuesto: 'impuesto_ejemplo',
          descripcion: 'Descripcion de ejemplo',
          impuesto1: 1000.5,
        },
      },
    },
  })
  create(@Body() createImpuestoDto: CreateImpuestoDto) {
    return this.impuestoService.create(createImpuestoDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.impuestoService.findAll(paginationDto)
  }
  @Get('search/:searchValue')
  search(@Param('searchValue') searchValue: string) {
    return this.impuestoService.search(searchValue)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.impuestoService.findOne(id)
  }

  @Patch(':id')
  @ApiBody({
    type: UpdateImpuestoDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          impuesto: 'impuesto_actualizado',
          descripcion: 'Descripcion actualizada',
          impuesto1: 150.75,
        },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateImpuestoDto: UpdateImpuestoDto,
  ) {
    return this.impuestoService.update(id, updateImpuestoDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.impuestoService.remove(id)
  }
}
