import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'

export class CreateProveedorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  proveedor: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string

  @IsString()
  @IsOptional()
  @MaxLength(30)
  contacto: string

  @IsString()
  @IsOptional()
  @MaxLength(30)
  cargo: string

  @IsString()
  @IsOptional()
  direccion: string

  @IsDateString()
  @IsOptional()
  fechaIngreso: string

  @IsDateString()
  @IsOptional()
  fechaUltMov: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  telefono1: string

  @IsString()
  @IsOptional()
  @MaxLength(50)
  telefono2: string

  @IsString()
  @IsOptional()
  @MaxLength(50)
  fax: string
  
  @IsNumber()
  @IsOptional()
  ordenMinima: number

  @IsNumber()
  @IsOptional()
  descuento: number

  @IsString()
  @IsOptional()
  @MaxLength(1)
  local: string

  @IsString()
  @IsOptional()
  @MaxLength(1)
  congelado: string

  @IsString()
  @IsOptional()
  @MaxLength(20)
  contribuyente: string

  @IsString()
  @IsOptional()
  @MaxLength(4)
  condicionPago: string

  @IsString()
  @IsOptional()
  @MaxLength(4)
  moneda: string

  @IsString()
  @IsOptional()
  @MaxLength(4)
  pais: string

  @IsString()
  @IsOptional()
  @MaxLength(8)
  categoriaProveed: string

  @IsString()
  @IsOptional()
  @MaxLength(1)
  multimoneda: string

  @IsNumber()
  @IsOptional()
  saldo: number

  @IsNumber()
  @IsOptional()
  saldoLocal: number

  @IsNumber()
  @IsOptional()
  saldoDolar: number

  @IsString()
  @IsOptional()
  @MaxLength(1)
  activo: string
}
