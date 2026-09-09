import { PartialType } from '@nestjs/swagger'
import { CreateCentroCuentaDto } from './create-centro-cuenta.dto'

export class UpdateCentroCuentaDto extends PartialType(CreateCentroCuentaDto) {}

