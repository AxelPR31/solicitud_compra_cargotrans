import { PartialType } from '@nestjs/swagger'
import { CreateImpuestoDto } from './create-impuesto.dto'

export class UpdateImpuestoDto extends PartialType(CreateImpuestoDto) {}
