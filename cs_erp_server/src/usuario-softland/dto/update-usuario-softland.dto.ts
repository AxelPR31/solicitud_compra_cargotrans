import { PartialType } from '@nestjs/swagger'
import { CreateUsuarioSoftlandDto } from './create-usuario-softland.dto'

export class UpdateUsuarioSoftlandDto extends PartialType(
  CreateUsuarioSoftlandDto,
) {}
