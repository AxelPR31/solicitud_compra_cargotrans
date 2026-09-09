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
import { CentrocostoService } from './centrocosto.service'
import { CreateCentrocostoDto } from './dto/create-centrocosto.dto'
import { UpdateCentrocostoDto } from './dto/update-centrocosto.dto'
import { PageOptionsDto } from '../../core/paging/dtos/page-options.dto'
import { PaginationDto } from '../../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'

import { AuthGuard } from '../../core/guards/auth.guard'

//@UseGuards(AuthGuard)
@Controller('centrocosto')
export class CentrocostoController {
  constructor(private readonly centrocostoService: CentrocostoService) {}

  @Post()
  @ApiBody({
    type: CreateCentrocostoDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          centrocosto: 'centrocosto_ejemplo',
          descripcion: 'Descripcion de ejemplo',
          aceptadatos: 'aceptadatos_ejemplo',
        },
      },
    },
  })
  create(@Body() createCentrocostoDto: CreateCentrocostoDto) {
    return this.centrocostoService.create(createCentrocostoDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.centrocostoService.findAll(paginationDto)
  }
  @Get('v1')
  findAllPaged(@Query() pageOptionsDto: PageOptionsDto) {
    return this.centrocostoService.getCentrocosto(pageOptionsDto)
  }
  @Get('search/:searchValue')
  search(@Param('searchValue') searchValue: string) {
    return this.centrocostoService.search(searchValue)
  }

  @Get(':centrocosto')
  findOne(@Param('centrocosto') centrocosto: string) {
    return this.centrocostoService.findOne(centrocosto)
  }

  @Patch(':centrocosto')
  @ApiBody({
    type: UpdateCentrocostoDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          centrocosto: 'centrocosto_actualizado',
          descripcion: 'Descripcion actualizada',
          aceptadatos: 'aceptadatos_actualizado',
        },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateCentrocostoDto: UpdateCentrocostoDto,
  ) {
    return this.centrocostoService.update(id, updateCentrocostoDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.centrocostoService.remove(id)
  }
}
