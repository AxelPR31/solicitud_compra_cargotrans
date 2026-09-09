import { PartialType } from '@nestjs/swagger'
import { CreateCentrocostoDto } from './create-centrocosto.dto'

export class UpdateCentrocostoDto extends PartialType(CreateCentrocostoDto) {}
