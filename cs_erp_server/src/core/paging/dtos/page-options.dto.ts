import { ApiPropertyOptional } from '@nestjs/swagger'
import { Order } from '../constants/order.constant'
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  IsDateString,
} from 'class-validator'
import { Type } from 'class-transformer'

export class PageOptionsDto {
  @ApiPropertyOptional({ enum: Order, default: Order.ASC })
  @IsEnum(Order)
  @IsOptional()
  readonly order?: Order = Order.ASC

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly property?: string

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  readonly take?: number = 10

  get skip(): number {
    return (this.page - 1) * this.take
  }

  @IsOptional()
  fecha?: Date

  @IsOptional()
  fecha_desde?: Date

  @IsOptional()
  fecha_hasta?: Date

  @IsOptional()
  @IsString()
  cliente?: string

  @IsOptional()
  @IsString()
  vendedor?: string

  @IsOptional()
  @IsString()
  estado?: string

  @IsOptional()
  @IsString()
  tipoRecibo?: string

  @IsOptional()
  @IsString()
  centroCosto?: string
  @IsOptional()
  @IsString()
  recibOficial?: string
  @IsOptional()
  @IsString()
  caja?: string
  @IsOptional()
  @IsString()
  tipo?: string
  @IsOptional()
  @IsString()
  zona?: string
  @IsOptional()
  @IsString()
  ruta?: string
  @IsOptional()
  @IsString()
  cuenta?: string
  @IsOptional()
  @IsString()
  napertura?: number
  @IsOptional()
  @IsString()
  anulado?: string

  @IsOptional()
  @IsString()
  servicio?: string

  @IsOptional()
  @IsString()
  noRecibo?: string

  @IsOptional()
  @IsString()
  moneda?: string

  // Número de depósito/minuta dentro de MOV_BANCOS
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  numero?: number
}
