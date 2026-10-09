import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { PaginationDto } from '../../common/dto/pagination.dto'

export class FindCsSolicitudOcDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrar por workflow (PLANEADA,APROBADA,RECHAZADA). Default: PLANEADA',
  })
  @IsOptional()
  @IsString()
  workflowEstado?: string

  @IsOptional()
  idDesde?: string

  @IsOptional()
  idHasta?: string

  @IsOptional()
  solicitudDesde?: string

  @IsOptional()
  solicitudHasta?: string

  @IsOptional()
  departamentoDesde?: string

  @IsOptional()
  departamentoHasta?: string

  @IsOptional()
  fechaSolicitudDesde?: string

  @IsOptional()
  fechaSolicitudHasta?: string

  @IsOptional()
  fechaRequeridaDesde?: string

  @IsOptional()
  fechaRequeridaHasta?: string

  @IsOptional()
  prioridades?: string
}
