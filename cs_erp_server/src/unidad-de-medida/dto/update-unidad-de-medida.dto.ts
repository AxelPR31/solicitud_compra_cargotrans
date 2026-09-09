import { PartialType } from '@nestjs/mapped-types'
import { CreateUnidadDeMedidaDto } from './create-unidad-de-medida.dto'

export class UpdateUnidadDeMedidaDto extends PartialType(CreateUnidadDeMedidaDto) {}
