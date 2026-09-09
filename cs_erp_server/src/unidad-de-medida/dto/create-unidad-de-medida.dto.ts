import { IsNotEmpty, IsString } from 'class-validator'

export class CreateUnidadDeMedidaDto {
  @IsNotEmpty()
  @IsString()
  unidadMedida: string

  @IsNotEmpty()
  @IsString()
  descripcion: string
}
