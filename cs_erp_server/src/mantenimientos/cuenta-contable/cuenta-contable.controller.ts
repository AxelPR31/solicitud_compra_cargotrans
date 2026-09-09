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
import { CuentacontableService } from './cuenta-contable.service'
import { CreateCuentacontableDto } from './dto/create-cuenta-contable.dto'
import { UpdateCuentacontableDto } from './dto/update-cuenta-contable.dto'
import { PageOptionsDto } from '../../core/paging/dtos/page-options.dto'
import { PaginationDto } from '../../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'

import { AuthGuard } from '../../core/guards/auth.guard'

//@UseGuards(AuthGuard)
@Controller('cuentacontable')
export class CuentacontableController {
  constructor(private readonly cuentacontableService: CuentacontableService) {}

  @Post()
  @ApiBody({
    type: CreateCuentacontableDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          cuentacontable: '6-01-001-0001',
          descripcion: 'Descripcion de ejemplo',
          tipo: 'GEN',
          tipodetalle: 'GEN',
          saldonormal: 'saldonormal_ejemplo',
          conversion: 'conversion_ejemplo',
          tipocambio: 'GEN',
          aceptadatos: 'aceptadatos_ejemplo',
          usacentro: 'usacentro_ejemplo',
          notas: 'notas_ejemplo',
        },
      },
    },
  })
  create(@Body() createCuentacontableDto: CreateCuentacontableDto) {
    return this.cuentacontableService.create(createCuentacontableDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.cuentacontableService.findAll(paginationDto)
  }
  @Get('v1')
  findAllPaged(@Query() pageOptionsDto: PageOptionsDto) {
    return this.cuentacontableService.getCuentacontable(pageOptionsDto)
  }
  @Get('search/:searchValue')
  search(@Param('searchValue') searchValue: string) {
    return this.cuentacontableService.search(searchValue)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cuentacontableService.findOne(id)
  }

  @Patch(':id')
  @ApiBody({
    type: UpdateCuentacontableDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          cuentacontable: '6-01-001-0001',
          descripcion: 'Descripcion actualizada',
          tipo: 'GEN',
        },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateCuentacontableDto: UpdateCuentacontableDto,
  ) {
    return this.cuentacontableService.update(id, updateCuentacontableDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cuentacontableService.remove(id)
  }
}
