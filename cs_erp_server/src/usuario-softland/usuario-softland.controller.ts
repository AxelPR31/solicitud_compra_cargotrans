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
import { UsuarioSoftlandService } from './usuario-softland.service'
import { CreateUsuarioSoftlandDto } from './dto/create-usuario-softland.dto'
import { UpdateUsuarioSoftlandDto } from './dto/update-usuario-softland.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { ApiBody } from '@nestjs/swagger'

import { AuthGuard } from '../core/guards/auth.guard'

@UseGuards(AuthGuard)
@Controller('usuario-softland')
export class UsuarioSoftlandController {
  constructor(
    private readonly usuarioSoftlandService: UsuarioSoftlandService,
  ) {}

  @Post()
  @ApiBody({
    type: CreateUsuarioSoftlandDto,
    examples: {
      default: {
        summary: 'POST create',
        value: {
          usuario: 'admin',
          nombre: 'Nombre de ejemplo',
          clave: 'clave_ejemplo',
        },
      },
    },
  })
  create(@Body() createUsuarioSoftlandDto: CreateUsuarioSoftlandDto) {
    return this.usuarioSoftlandService.create(createUsuarioSoftlandDto)
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usuarioSoftlandService.findAll(paginationDto)
  }

  @Get(':usuario')
  findOne(@Param('usuario') usuario: string) {
    return this.usuarioSoftlandService.findOne(decodeURIComponent(usuario))
  }

  @Patch(':usuario')
  @ApiBody({
    type: UpdateUsuarioSoftlandDto,
    examples: {
      default: {
        summary: 'PATCH update',
        value: {
          usuario: 'admin',
          nombre: 'Nombre actualizado',
          clave: 'clave_actualizado',
        },
      },
    },
  })
  update(
    @Param('usuario') usuario: string,
    @Body() updateUsuarioSoftlandDto: UpdateUsuarioSoftlandDto,
  ) {
    return this.usuarioSoftlandService.update(
      decodeURIComponent(usuario),
      updateUsuarioSoftlandDto,
    )
  }

  @Delete(':usuario')
  remove(@Param('usuario') usuario: string) {
    return this.usuarioSoftlandService.remove(decodeURIComponent(usuario))
  }
}
