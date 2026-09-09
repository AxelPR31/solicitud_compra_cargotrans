import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsOptional, IsPositive, Min } from 'class-validator'

export class PaginationDto {
  @ApiProperty({
    default: 10,
    description: 'Number of items to return',
  })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit?: number

  @ApiProperty({
    default: 10,
    description: 'Number of items to skip',
  })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number

  @ApiProperty({
    required: false,
    description: 'Search keyword for code or description',
  })
  @IsOptional()
  q?: string
}
