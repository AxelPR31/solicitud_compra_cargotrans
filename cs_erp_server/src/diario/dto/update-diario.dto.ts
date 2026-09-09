import { PartialType } from '@nestjs/swagger'
import { CreateDiarioDto } from './create-diario.dto'

export class UpdateDiarioDto extends PartialType(CreateDiarioDto) {}
