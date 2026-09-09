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
import { PaisService } from './pais.service'
import { CreatePaiDto } from './dto/create-pai.dto'
import { UpdatePaiDto } from './dto/update-pai.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'

import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('pais')
export class PaisController {
  constructor(private readonly paisService: PaisService) {}

  @Post()
  @ApiBody({
    type: CreatePaiDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          pais: 'pais_ejemplo',
          nombre: 'Nombre de ejemplo',
        },
      },
    },
  })
  create(@Body() createPaiDto: CreatePaiDto) {
    return this.paisService.create(createPaiDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.paisService.findAll(paginationDto)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paisService.findOne(+id)
  }

  @Patch(':id')
  @ApiBody({
    type: UpdatePaiDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          pais: 'pais_actualizado',
          nombre: 'Nombre actualizado',
        },
      },
    },
  })
  update(@Param('id') id: string, @Body() updatePaiDto: UpdatePaiDto) {
    return this.paisService.update(+id, updatePaiDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paisService.remove(+id)
  }
}
