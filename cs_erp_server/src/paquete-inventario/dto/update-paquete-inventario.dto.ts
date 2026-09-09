import { PartialType } from '@nestjs/swagger'
import { CreatePaqueteInventarioDto } from './create-paquete-inventario.dto'

export class UpdatePaqueteInventarioDto extends PartialType(CreatePaqueteInventarioDto) {}
