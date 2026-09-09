import { Controller, Get, Param, Res, Query } from '@nestjs/common'
import { Response } from 'express'
import { ReportesService } from './reportes.service'

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('orden-produccion/:id/excel')
  async getOrdenProduccionExcel(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    return this.reportesService.exportExcel(Number(id), res)
  }

  @Get('orden-produccion/:id/pdf')
  async getOrdenProduccionPdf(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    return this.reportesService.exportPdf(Number(id), res)
  }

  @Get('traslado-interno/:id/pdf')
  async getTrasladoInternoPdf(
    @Param('id') id: string,
    @Query('logos') logos: string,
    @Query('titulo') titulo: string,
    @Res() res: Response,
  ) {
    return this.reportesService.exportTrasladoPdf(Number(id), logos || 'none', titulo || '', res)
  }
}
