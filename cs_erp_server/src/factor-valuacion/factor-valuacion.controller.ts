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
import { PaginationDto } from '../common/dto/pagination.dto'
import { CreateFactorValuacionDto } from './dto/create-factor-valuacion.dto'
import { UpdateFactorValuacionDto } from './dto/update-factor-valuacion.dto'
import { FactorValuacionService } from './factor-valuacion.service'
import { AuthGuard } from '../core/guards/auth.guard'

//@UseGuards(AuthGuard)
@Controller('factor-valuacion')
export class FactorValuacionController {
  constructor(
    private readonly factorValuacionService: FactorValuacionService,
  ) {}

  @Post()
  create(@Body() createFactorValuacionDto: CreateFactorValuacionDto) {
    return this.factorValuacionService.create(createFactorValuacionDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.factorValuacionService.findAll(paginationDto)
  }

  @Get(':articulo')
  findOne(@Param('articulo') articulo: string) {
    return this.factorValuacionService.findOne(decodeURIComponent(articulo))
  }

  @Patch(':articulo')
  update(
    @Param('articulo') articulo: string,
    @Body() updateFactorValuacionDto: UpdateFactorValuacionDto,
  ) {
    return this.factorValuacionService.update(
      decodeURIComponent(articulo),
      updateFactorValuacionDto,
    )
  }

  @Delete(':articulo')
  remove(@Param('articulo') articulo: string) {
    return this.factorValuacionService.remove(decodeURIComponent(articulo))
  }
}
