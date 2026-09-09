import { ApiProperty } from '@nestjs/swagger'

export class CreateAsientoMayorizadoDto {
  @ApiProperty({ example: '0000000001', maxLength: 10 })
  asiento: string

  @ApiProperty({ example: 1 })
  mayorAuditoria: number

  @ApiProperty({ example: 'DIAR', maxLength: 4 })
  tipoAsiento: string

  @ApiProperty({ example: '2026-04-29T12:00:00.000Z' })
  fecha: Date

  @ApiProperty({ example: 'F', maxLength: 1 })
  contabilidad: string

  @ApiProperty({ example: 'CB', maxLength: 4 })
  origen: string

  @ApiProperty({ example: 'N', maxLength: 1 })
  claseAsiento: string

  @ApiProperty({ example: 'usuario-ejemplo', maxLength: 50 })
  ultimoUsuario: string

  @ApiProperty({ example: 0 })
  montoTotalLocal: number

  @ApiProperty({ example: 0 })
  montoTotalDolar: number

  @ApiProperty({ example: 'Notas', nullable: true })
  notas: string

  @ApiProperty({ example: 'usuario-ejemplo', maxLength: 50 })
  usuarioCreacion: string

  // fechaCreacion se llena en DB con CreateDateColumn

  @ApiProperty({ example: 'N', maxLength: 1 })
  exportado: string

  @ApiProperty({ example: 'M', maxLength: 1 })
  tipoIngresoMayor: string
}

