import { PartialType } from '@nestjs/swagger'
import { CreateRecetaDetalleDto } from './create-receta-detalle.dto'

export class UpdateRecetaDetalleDto extends PartialType(CreateRecetaDetalleDto) {}
