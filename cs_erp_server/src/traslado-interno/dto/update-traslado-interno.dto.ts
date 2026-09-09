import { PartialType } from '@nestjs/swagger'
import { CreateTrasladoInternoDto } from './create-traslado-interno.dto'

export class UpdateTrasladoInternoDto extends PartialType(CreateTrasladoInternoDto) {
  estado?: string
  documentoInvSoftland?: string
}
