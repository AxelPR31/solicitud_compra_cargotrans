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
import { CuentaBancariaService } from './cuenta-bancaria.service'
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto'
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto'
import { PageOptionsDto } from '../core/paging/dtos/page-options.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'
import { User } from '../core/decorators/user.decorator'
import { UserPrincipal } from '../auth/types/user-principal'
import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('cuenta-bancaria')
export class CuentaBancariaController {
  constructor(private readonly cuentaBancariaService: CuentaBancariaService) {}

  @Post()
  @ApiBody({
    type: CreateCuentaBancariaDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          cuentaBanco: '001-0023456-7',
          nombre: 'Nombre de ejemplo',
          entidad: 'entidad_ejemplo',
          moneda: 'moneda_ejemplo',
          centroCosto: 'centroCosto_ejemplo',
        },
      },
    },
  })
  create(@Body() createCuentaBancariaDto: CreateCuentaBancariaDto) {
    return this.cuentaBancariaService.create(createCuentaBancariaDto)
  }
  @Get('v1')
  findAllPaged(@Query() pageOptionsDto: PageOptionsDto) {
    return this.cuentaBancariaService.getCuentabanca(pageOptionsDto)
  }
  @Get()
  findAll(@User() user: UserPrincipal, @Query() paginationDto: PaginationDto) {
    return this.cuentaBancariaService.findAll(paginationDto, user)
  }
  @Get('search/:searchValue')
  search(@Param('searchValue') searchValue: string) {
    return this.cuentaBancariaService.search(searchValue)
  }

  @Get(':cuentaBanco')
  findOneByCuentaBanco(
    @User() user: UserPrincipal,
    @Param('cuentaBanco') cuentaBanco: string,
  ) {
    return this.cuentaBancariaService.findByCuentaBanco(cuentaBanco, user)
  }

  @Patch(':id')
  @ApiBody({
    type: UpdateCuentaBancariaDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          cuentaBanco: '001-0023456-7',
          nombre: 'Nombre actualizado',
          entidad: 'entidad_actualizado',
        },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateCuentaBancariaDto: UpdateCuentaBancariaDto,
  ) {
    return this.cuentaBancariaService.update(id, updateCuentaBancariaDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cuentaBancariaService.remove(+id)
  }
}

