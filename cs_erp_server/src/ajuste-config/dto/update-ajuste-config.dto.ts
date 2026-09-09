import { PartialType } from '@nestjs/swagger'
import { CreateAjusteConfigDto } from './create-ajuste-config.dto'

export class UpdateAjusteConfigDto extends PartialType(CreateAjusteConfigDto) {}
