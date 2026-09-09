import { PartialType } from '@nestjs/swagger'
import { CreateAsientoDeDiarioDto } from './create-asiento-de-diario.dto'

export class UpdateAsientoDeDiarioDto extends PartialType(
  CreateAsientoDeDiarioDto,
) {}
