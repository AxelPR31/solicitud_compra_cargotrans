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
import { ApiBody } from '@nestjs/swagger'
import { AuthGuard } from '../core/guards/auth.guard'
import { PaginationDto } from '../common/dto/pagination.dto'
import { CreateCentroCuentaDto } from './dto/create-centro-cuenta.dto'
import { UpdateCentroCuentaDto } from './dto/update-centro-cuenta.dto'
import { CentroCuentaService } from './centro-cuenta.service'

//@UseGuards(AuthGuard)
@Controller('centro-cuenta')
export class CentroCuentaController {
  constructor(private readonly centroCuentaService: CentroCuentaService) {}

  @Post()
  @ApiBody({
    type: CreateCentroCuentaDto,
    examples: {
      default: {
        summary: 'Crear relación centro-cuenta',
        value: {
          centroCosto: '000-00-0000',
          cuentaContable: '1-01-001-0001',
          estado: 'A',
        },
      },
    },
  })
  create(@Body() dto: CreateCentroCuentaDto) {
    return this.centroCuentaService.create(dto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto & { q?: string }) {
    return this.centroCuentaService.findAll(paginationDto)
  }

  @Get(':centroCosto/:cuentaContable')
  findOne(
    @Param('centroCosto') centroCosto: string,
    @Param('cuentaContable') cuentaContable: string,
  ) {
    return this.centroCuentaService.findOne({ centroCosto, cuentaContable })
  }

  @Patch(':centroCosto/:cuentaContable')
  @ApiBody({
    type: UpdateCentroCuentaDto,
    examples: {
      default: {
        summary: 'Actualizar estado',
        value: {
          estado: 'I',
        },
      },
    },
  })
  update(
    @Param('centroCosto') centroCosto: string,
    @Param('cuentaContable') cuentaContable: string,
    @Body() dto: UpdateCentroCuentaDto,
  ) {
    return this.centroCuentaService.update({ centroCosto, cuentaContable }, dto)
  }

  @Delete(':centroCosto/:cuentaContable')
  remove(
    @Param('centroCosto') centroCosto: string,
    @Param('cuentaContable') cuentaContable: string,
  ) {
    return this.centroCuentaService.remove({ centroCosto, cuentaContable })
  }
}

