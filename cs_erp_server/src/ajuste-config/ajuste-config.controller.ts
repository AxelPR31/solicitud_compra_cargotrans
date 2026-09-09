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
import { CreateAjusteConfigDto } from './dto/create-ajuste-config.dto'
import { UpdateAjusteConfigDto } from './dto/update-ajuste-config.dto'
import { AjusteConfigService } from './ajuste-config.service'
import { AuthGuard } from '../core/guards/auth.guard'

//@UseGuards(AuthGuard)
@Controller('ajuste-config')
export class AjusteConfigController {
  constructor(private readonly ajusteConfigService: AjusteConfigService) {}

  @Post()
  create(@Body() createAjusteConfigDto: CreateAjusteConfigDto) {
    return this.ajusteConfigService.create(createAjusteConfigDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.ajusteConfigService.findAll(paginationDto)
  }

  @Get(':ajusteBase')
  findOne(@Param('ajusteBase') ajusteBase: string) {
    return this.ajusteConfigService.findOne(decodeURIComponent(ajusteBase))
  }

  @Patch(':ajusteBase')
  update(
    @Param('ajusteBase') ajusteBase: string,
    @Body() updateAjusteConfigDto: UpdateAjusteConfigDto,
  ) {
    return this.ajusteConfigService.update(
      decodeURIComponent(ajusteBase),
      updateAjusteConfigDto,
    )
  }

  @Delete(':ajusteBase')
  remove(@Param('ajusteBase') ajusteBase: string) {
    return this.ajusteConfigService.remove(decodeURIComponent(ajusteBase))
  }
}
