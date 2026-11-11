import { IsOptional, IsString } from 'class-validator'
import { PaginationDto } from '../../common/dto/pagination.dto'

export class FindOrdenCompraDto extends PaginationDto {
  /** Valores separados por coma: A,E,I,N,O,P,R. Default: A */
  @IsOptional()
  @IsString()
  estados?: string

  @IsOptional()
  @IsString()
  ordenDesde?: string

  @IsOptional()
  @IsString()
  ordenHasta?: string

  @IsOptional()
  @IsString()
  fechaDesde?: string

  @IsOptional()
  @IsString()
  fechaHasta?: string
}
