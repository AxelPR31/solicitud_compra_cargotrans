import { PartialType } from '@nestjs/mapped-types'
import { CreateConfiguracionDefectoDto } from './create-configuracion-defecto.dto'

export class UpdateConfiguracionDefectoDto extends PartialType(CreateConfiguracionDefectoDto) {}
