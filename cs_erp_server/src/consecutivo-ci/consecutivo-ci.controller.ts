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
import { CreateConsecutivoCiDto } from './dto/create-consecutivo-ci.dto'
import { UpdateConsecutivoCiDto } from './dto/update-consecutivo-ci.dto'
import { ConsecutivoCiService } from './consecutivo-ci.service'
import { AuthGuard } from '../core/guards/auth.guard'

//@UseGuards(AuthGuard)
@Controller('consecutivo-ci')
export class ConsecutivoCiController {
  constructor(private readonly consecutivoCiService: ConsecutivoCiService) {}

  @Post('siguiente/:consecutivo')
  obtenerSiguiente(@Param('consecutivo') consecutivo: string) {
    return this.consecutivoCiService.obtenerSiguiente(decodeURIComponent(consecutivo))
  }

  @Post()
  create(@Body() createConsecutivoCiDto: CreateConsecutivoCiDto) {
    return this.consecutivoCiService.create(createConsecutivoCiDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.consecutivoCiService.findAll(paginationDto)
  }

  @Get(':consecutivo')
  findOne(@Param('consecutivo') consecutivo: string) {
    return this.consecutivoCiService.findOne(decodeURIComponent(consecutivo))
  }

  @Patch(':consecutivo')
  update(
    @Param('consecutivo') consecutivo: string,
    @Body() updateConsecutivoCiDto: UpdateConsecutivoCiDto,
  ) {
    return this.consecutivoCiService.update(
      decodeURIComponent(consecutivo),
      updateConsecutivoCiDto,
    )
  }

  @Delete(':consecutivo')
  remove(@Param('consecutivo') consecutivo: string) {
    return this.consecutivoCiService.remove(decodeURIComponent(consecutivo))
  }
}
