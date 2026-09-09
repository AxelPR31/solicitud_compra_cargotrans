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
import { PaginationDto } from '../common/dto/pagination.dto'
import { CreatePaqueteDto } from './dto/create-paquete.dto'
import { UpdatePaqueteDto } from './dto/update-paquete.dto'
import { PaqueteService } from './paquete.service'
import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('paquete')
export class PaqueteController {
  constructor(private readonly paqueteService: PaqueteService) {}

  @Post()
  @ApiBody({
    type: CreatePaqueteDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          paquete: 'CB',
          descripcion: 'Caja chica proyectos',
          ultimoAsiento: 'CB-2026-000123',
        },
      },
    },
  })
  create(@Body() createPaqueteDto: CreatePaqueteDto) {
    return this.paqueteService.create(createPaqueteDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.paqueteService.findAll(paginationDto)
  }

  @Get(':paquete')
  findOne(@Param('paquete') paquete: string) {
    return this.paqueteService.findOne(decodeURIComponent(paquete))
  }

  @Patch(':paquete')
  @ApiBody({
    type: UpdatePaqueteDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          descripcion: 'Caja chica proyectos actualizada',
          ultimoAsiento: 'CB-2026-000124',
        },
      },
    },
  })
  update(
    @Param('paquete') paquete: string,
    @Body() updatePaqueteDto: UpdatePaqueteDto,
  ) {
    return this.paqueteService.update(
      decodeURIComponent(paquete),
      updatePaqueteDto,
    )
  }

  @Delete(':paquete')
  remove(@Param('paquete') paquete: string) {
    return this.paqueteService.remove(decodeURIComponent(paquete))
  }
}
