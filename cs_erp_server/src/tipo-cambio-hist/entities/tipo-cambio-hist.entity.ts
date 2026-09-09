import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'TIPO_CAMBIO_HIST', synchronize: false })
export class TipoCambioHist {
  @PrimaryColumn({ name: 'TIPO_CAMBIO' })
  tipo: string
  @PrimaryColumn({ type: 'datetime' })
  fecha: Date
  @Column({ type: 'decimal', precision: 28, scale: 8 })
  monto: number
}

