import { Controller, Get } from '@nestjs/common'
import { GlobalesCoService } from './globales-co.service'

@Controller('globales-co')
export class GlobalesCoController {
  constructor(private readonly globalesCoService: GlobalesCoService) {}

  @Get()
  findOne() {
    return this.globalesCoService.findOne()
  }

  @Get('siguiente-solicitud')
  getSiguienteSolicitud() {
    return this.globalesCoService.getSiguienteSolicitudPreview()
  }
}
