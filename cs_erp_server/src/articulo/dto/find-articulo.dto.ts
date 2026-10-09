import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { PaginationDto } from '../../common/dto/pagination.dto'

export class FindArticuloDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtra códigos que empiezan con este prefijo (ej. ITEM)',
  })
  @IsOptional()
  @IsString()
  prefix?: string
}
