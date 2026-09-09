import { PartialType } from '@nestjs/swagger'
import { CreateTipoCambioHistDto } from './create-tipo-cambio-hist.dto'

export class UpdateTipoCambioHistDto extends PartialType(
  CreateTipoCambioHistDto,
) {}
