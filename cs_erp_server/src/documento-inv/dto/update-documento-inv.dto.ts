import { PartialType } from '@nestjs/swagger'
import { CreateDocumentoInvDto } from './create-documento-inv.dto'

export class UpdateDocumentoInvDto extends PartialType(CreateDocumentoInvDto) {}
