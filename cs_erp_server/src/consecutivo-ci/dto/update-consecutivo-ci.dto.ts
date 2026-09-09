import { PartialType } from '@nestjs/swagger'
import { CreateConsecutivoCiDto } from './create-consecutivo-ci.dto'

export class UpdateConsecutivoCiDto extends PartialType(CreateConsecutivoCiDto) {}
