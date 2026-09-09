import { PartialType } from '@nestjs/swagger'
import { CreateMovBancoDto } from './create-mov-banco.dto'

export class UpdateMovBancoDto extends PartialType(CreateMovBancoDto) {}
