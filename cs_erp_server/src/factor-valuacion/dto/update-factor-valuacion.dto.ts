import { PartialType } from '@nestjs/swagger'
import { CreateFactorValuacionDto } from './create-factor-valuacion.dto'

export class UpdateFactorValuacionDto extends PartialType(CreateFactorValuacionDto) {}
