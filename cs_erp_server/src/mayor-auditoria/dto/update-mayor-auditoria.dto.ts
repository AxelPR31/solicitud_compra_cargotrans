import { PartialType } from '@nestjs/swagger';
import { CreateMayorAuditoriaDto } from './create-mayor-auditoria.dto';

export class UpdateMayorAuditoriaDto extends PartialType(CreateMayorAuditoriaDto) {}
