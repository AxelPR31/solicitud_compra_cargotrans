import { PartialType } from '@nestjs/mapped-types'
import { CreateExistenciaBodegaDto } from './create-existencia-bodega.dto'

export class UpdateExistenciaBodegaDto extends PartialType(CreateExistenciaBodegaDto) {}
