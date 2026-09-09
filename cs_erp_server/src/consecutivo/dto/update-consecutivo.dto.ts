import { PartialType } from '@nestjs/swagger'
import { CreateConsecutivoDto } from './create-consecutivo.dto'

export class UpdateConsecutivoDto extends PartialType(CreateConsecutivoDto) {}
