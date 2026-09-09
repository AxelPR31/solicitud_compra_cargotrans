import { Column, Entity, PrimaryColumn } from 'typeorm'

export type TipoConsecutivo = 'ORDEN_PRODUCCION' | 'TRASLADO_INTERNO';

@Entity({ name: 'CS_CONSECUTIVO_APP_CONSUMO', synchronize: true })
export class ConsecutivoAppConsumo {
  @PrimaryColumn({ name: 'TIPO' })
  tipo: TipoConsecutivo

  @Column({ name: 'SIGUIENTE', type: 'int', default: 1 })
  siguiente: number

  @Column({ name: 'MASCARA', default: '' })
  mascara: string // e.g. 'OP-######', 'TR-######', or '######'
}
