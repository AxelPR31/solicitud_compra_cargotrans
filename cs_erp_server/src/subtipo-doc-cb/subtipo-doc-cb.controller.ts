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
import { SubtipoDocCbService } from './subtipo-doc-cb.service'
import { CreateSubtipoDocCbDto } from './dto/create-subtipo-doc-cb.dto'
import { UpdateSubtipoDocCbDto } from './dto/update-subtipo-doc-cb.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'

import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('subtipo-doc-cb')
export class SubtipoDocCbController {
  constructor(private readonly subtipoDocCbService: SubtipoDocCbService) {}

  @Post()
  @ApiBody({
    type: CreateSubtipoDocCbDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          tipo: 'GEN',
          descripcion: 'Descripcion de ejemplo',
        },
      },
    },
  })
  create(@Body() createSubtipoDocCbDto: CreateSubtipoDocCbDto) {
    return this.subtipoDocCbService.create(createSubtipoDocCbDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.subtipoDocCbService.findAll(paginationDto)
  }

  @Get(':tipo')
  findOne(@Param('tipo') tipo: string) {
    return this.subtipoDocCbService.findOne(decodeURIComponent(tipo))
  }

  @Patch(':tipo')
  @ApiBody({
    type: UpdateSubtipoDocCbDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          tipo: 'GEN',
          descripcion: 'Descripcion actualizada',
        },
      },
    },
  })
  update(
    @Param('tipo') tipo: string,
    @Body() updateSubtipoDocCbDto: UpdateSubtipoDocCbDto,
  ) {
    return this.subtipoDocCbService.update(
      decodeURIComponent(tipo),
      updateSubtipoDocCbDto,
    )
  }

  @Delete(':tipo')
  remove(@Param('tipo') tipo: string) {
    return this.subtipoDocCbService.remove(decodeURIComponent(tipo))
  }
}
