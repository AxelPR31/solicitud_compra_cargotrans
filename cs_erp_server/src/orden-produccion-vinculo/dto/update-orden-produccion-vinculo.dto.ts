import { PartialType } from '@nestjs/swagger'
import { CreateOrdenProduccionVinculoDto } from './create-orden-produccion-vinculo.dto'

export class UpdateOrdenProduccionVinculoDto extends PartialType(CreateOrdenProduccionVinculoDto) {}
