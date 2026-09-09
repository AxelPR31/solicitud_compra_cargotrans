import { PartialType } from '@nestjs/swagger'
import { CreateSubtipoDocCbDto } from './create-subtipo-doc-cb.dto'

export class UpdateSubtipoDocCbDto extends PartialType(CreateSubtipoDocCbDto) {}
