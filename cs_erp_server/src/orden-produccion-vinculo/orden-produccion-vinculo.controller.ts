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
import { CreateOrdenProduccionVinculoDto } from './dto/create-orden-produccion-vinculo.dto'
import { UpdateOrdenProduccionVinculoDto } from './dto/update-orden-produccion-vinculo.dto'
import { OrdenProduccionVinculoService } from './orden-produccion-vinculo.service'
import { AuthGuard } from '../core/guards/auth.guard'

//@UseGuards(AuthGuard)
@Controller('orden-produccion-vinculo')
export class OrdenProduccionVinculoController {
  constructor(
    private readonly ordenProduccionVinculoService: OrdenProduccionVinculoService,
  ) {}

  @Get('config')
  getConfig() {
    return {
      paquete: process.env.PROD_PAQUETE || 'TRAN',
      consecutivo: process.env.PROD_CONSECUTIVO || 'TRANS'
    }
  }

  @Post('calcular')
  calcular(@Body() body: any) {
    return this.ordenProduccionVinculoService.calcular(body)
  }

  @Post()
  create(
    @Body() createOrdenProduccionVinculoDto: CreateOrdenProduccionVinculoDto,
  ) {
    return this.ordenProduccionVinculoService.create(
      createOrdenProduccionVinculoDto,
    )
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.ordenProduccionVinculoService.findAll(paginationDto)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordenProduccionVinculoService.findOne(+id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrdenProduccionVinculoDto: UpdateOrdenProduccionVinculoDto,
  ) {
    return this.ordenProduccionVinculoService.update(
      +id,
      updateOrdenProduccionVinculoDto,
    )
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordenProduccionVinculoService.remove(+id)
  }
}
