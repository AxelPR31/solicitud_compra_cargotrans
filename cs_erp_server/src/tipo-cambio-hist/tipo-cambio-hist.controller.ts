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
import { TipoCambioHistService } from './tipo-cambio-hist.service'
import { CreateTipoCambioHistDto } from './dto/create-tipo-cambio-hist.dto'
import { UpdateTipoCambioHistDto } from './dto/update-tipo-cambio-hist.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'

import { AuthGuard } from '../core/guards/auth.guard'

//@UseGuards(AuthGuard)
@Controller('tipo-cambio-hist')
export class TipoCambioHistController {
  constructor(private readonly tipoCambioHistService: TipoCambioHistService) {}

  @Post()
  @ApiBody({
    type: CreateTipoCambioHistDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          tipo: 'GEN',
          fecha: '2026-04-20T00:00:00.000Z',
          monto: 1000.5,
        },
      },
    },
  })
  create(@Body() createTipoCambioHistDto: CreateTipoCambioHistDto) {
    return this.tipoCambioHistService.create(createTipoCambioHistDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.tipoCambioHistService.findAll(paginationDto)
  }

  @Get('ofic/latest')
  findLatestOfic() {
    return this.tipoCambioHistService.findLatestOfic()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipoCambioHistService.findOne(+id)
  }

  @Patch(':id')
  @ApiBody({
    type: UpdateTipoCambioHistDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          tipo: 'GEN',
          fecha: '2026-04-20T00:00:00.000Z',
          monto: 150.75,
        },
      },
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateTipoCambioHistDto: UpdateTipoCambioHistDto,
  ) {
    return this.tipoCambioHistService.update(+id, updateTipoCambioHistDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipoCambioHistService.remove(+id)
  }
}
