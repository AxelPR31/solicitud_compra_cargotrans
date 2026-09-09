import { ApiProperty } from '@nestjs/swagger'

export class CreateMayorAuditoriaDto {
  @ApiProperty({ example: 'usuario-ejemplo', maxLength: 50 })
  usuario: string

  @ApiProperty({ example: '2026-04-29T12:00:00.000Z' })
  fecha: Date

  @ApiProperty({ example: 'Comentario de ejemplo', maxLength: 40 })
  comentario: string
}

