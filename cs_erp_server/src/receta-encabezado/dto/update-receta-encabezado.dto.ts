import { PartialType } from '@nestjs/swagger'
import { CreateRecetaEncabezadoDto } from './create-receta-encabezado.dto'

export class UpdateRecetaEncabezadoDto extends PartialType(CreateRecetaEncabezadoDto) {}
