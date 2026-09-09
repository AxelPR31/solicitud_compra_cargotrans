import { PartialType } from '@nestjs/swagger'
import { CreateRetencionDto } from './create-retencion.dto'

export class UpdateRetencionDto extends PartialType(CreateRetencionDto) {}
