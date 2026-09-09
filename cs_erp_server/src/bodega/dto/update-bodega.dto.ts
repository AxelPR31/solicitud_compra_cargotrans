import { PartialType } from '@nestjs/mapped-types'
import { CreateBodegaDto } from './create-bodega.dto'

export class UpdateBodegaDto extends PartialType(CreateBodegaDto) {}
