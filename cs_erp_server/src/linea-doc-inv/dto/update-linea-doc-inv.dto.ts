import { PartialType } from '@nestjs/swagger'
import { CreateLineaDocInvDto } from './create-linea-doc-inv.dto'

export class UpdateLineaDocInvDto extends PartialType(CreateLineaDocInvDto) {}
