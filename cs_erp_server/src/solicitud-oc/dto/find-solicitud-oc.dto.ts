import { IsOptional } from 'class-validator'
import { PaginationDto } from '../../common/dto/pagination.dto'

export class FindSolicitudOcDto extends PaginationDto {
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

  /** Valores separados por coma: A,M,Z */
  @IsOptional()
  prioridades?: string

  /** Valores separados por coma: A,E,I,O */
  @IsOptional()
  estados?: string
}
