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
import { ConsecutivoService } from './consecutivo.service'
import { CreateConsecutivoDto } from './dto/create-consecutivo.dto'
import { UpdateConsecutivoDto } from './dto/update-consecutivo.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'

import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('consecutivo')
export class ConsecutivoController {
  constructor(private readonly consecutivoService: ConsecutivoService) {}

  @Post()
  @ApiBody({
    type: CreateConsecutivoDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          consecutivo: 'consecutivo_ejemplo',
          documento: 'documento_ejemplo',
          activo: 'activo_ejemplo',
          ultimoValor: 'ultimoValor_ejemplo',
          mascara: 'mascara_ejemplo',
        },
      },
    },
  })
  create(@Body() createConsecutivoDto: CreateConsecutivoDto) {
    return this.consecutivoService.create(createConsecutivoDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.consecutivoService.findAll(paginationDto)
  }

  @Get('/for-user')
  getForUser() {
    return this.consecutivoService.getConsecutivosUser()
  }

  @Get('nuevo')
  async getNuevoConsecutivo(
    @Query('consecutivo') consecutivo: string,
    @Query('documento') documento: string,
    @Query('tipo') tipo: string,
  ) {
    return await this.consecutivoService.getNuevoConsecutivo(
      consecutivo,
      documento,
      tipo,
    )
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consecutivoService.findOne(+id)
  }

  @Patch(':id')
  @ApiBody({
    type: UpdateConsecutivoDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          consecutivo: 'consecutivo_actualizado',
          documento: 'documento_actualizado',
          activo: 'activo_actualizado',
        },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateConsecutivoDto: UpdateConsecutivoDto,
  ) {
    return this.consecutivoService.update(+id, updateConsecutivoDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.consecutivoService.remove(+id)
  }
}
