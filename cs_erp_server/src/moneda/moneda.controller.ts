import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Query,
  UseGuards,
} from '@nestjs/common'
import { MonedaService } from './moneda.service'
import { CreateMonedaDto } from './dto/create-moneda.dto'
import { UpdateMonedaDto } from './dto/update-moneda.dto'
import { PageOptionsDto } from 'src/core/paging/dtos/page-options.dto'
import { User } from 'src/core/decorators/user.decorator'
import { AuthGuard } from 'src/core/guards/auth.guard'
import { PaginationDto } from '../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'


@UseGuards(AuthGuard)
@Controller('moneda')
export class MonedaController {
  constructor(private readonly monedaService: MonedaService) {}

  @Post()
  @ApiBody({
    type: CreateMonedaDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          moneda: 'moneda_ejemplo',
          nombre: 'Nombre de ejemplo',
        },
      },
    },
  })
  create(@Body() createMonedaDto: CreateMonedaDto) {
    return this.monedaService.create(createMonedaDto)
  }

  @Get()
  //@UseGuards(AuthGuard)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.monedaService.findAll(paginationDto)
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.monedaService.findOne(id)
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateMonedaDto: UpdateMonedaDto) {
    return this.monedaService.update(id, updateMonedaDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.monedaService.remove(id)
  }

  // @Get('v1')
  // @UseGuards(AuthGuard)
  // findAllPaged(
  //   @Query() pageOptionsDto: PageOptionsDto,
  //   @User() user: UsuarioCaja,
  // ) {
  //   return this.monedaService.findAllPaged(pageOptionsDto)
  // }

  @Get('search/:searchValue')
  search(
    @Param('searchValue') searchValue: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    return this.monedaService.search(pageOptionsDto, searchValue)
  }
}
