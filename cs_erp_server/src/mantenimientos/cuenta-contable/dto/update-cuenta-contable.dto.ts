import { PartialType } from '@nestjs/mapped-types'
import { CreateCuentacontableDto } from './create-cuenta-contable.dto'

export class UpdateCuentacontableDto extends PartialType(
  CreateCuentacontableDto,
) {}
