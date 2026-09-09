import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'CS_FACTOR_VALUACION', synchronize: true })
export class FactorValuacion {
  @PrimaryColumn({ name: 'ARTICULO' })
  articulo: string

  @Column({ name: 'FACTOR', type: 'decimal', precision: 28, scale: 8 })
  factor: number
}
