import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'EXISTENCIA_BODEGA', synchronize: false })
export class ExistenciaBodega {
  @PrimaryColumn({ name: 'ARTICULO' })
  articulo: string

  @PrimaryColumn({ name: 'BODEGA' })
  bodega: string

  @Column({ name: 'CANT_TRANSITO', type: 'decimal', precision: 28, scale: 8 })
  cantTransito: number
}
