import { PartialType } from '@nestjs/swagger'
import { CreateMonedaDto } from './create-moneda.dto'

class UpdateMonedaBaseDto {
  nombre: string
}

export class UpdateMonedaDto extends PartialType(UpdateMonedaBaseDto) {}
