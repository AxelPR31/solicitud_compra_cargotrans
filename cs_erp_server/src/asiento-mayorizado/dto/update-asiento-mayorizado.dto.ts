import { PartialType } from '@nestjs/swagger';
import { CreateAsientoMayorizadoDto } from './create-asiento-mayorizado.dto';

export class UpdateAsientoMayorizadoDto extends PartialType(CreateAsientoMayorizadoDto) {}
