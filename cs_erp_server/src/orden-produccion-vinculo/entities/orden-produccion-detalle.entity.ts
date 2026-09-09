import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'CS_ORDEN_PRODUCCION_DETALLE', synchronize: true })
export class OrdenProduccionDetalle {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'VINCULO_ID' })
  vinculoId: number

  @Column({ name: 'ARTICULO' })
  articulo: string

  @Column({ name: 'NOMBRE', nullable: true })
  nombre: string

  @Column({ name: 'CANTIDAD_UNITARIA', type: 'decimal', precision: 28, scale: 8, default: 0 })
  cantidadUnitaria: number

  @Column({ name: 'CANTIDAD_LIBRA', type: 'decimal', precision: 28, scale: 8, default: 0 })
  cantidadLibra: number

  @Column({ name: 'NUEVO_COSTO_UNITARIO', type: 'decimal', precision: 28, scale: 8, nullable: true, default: 0 })
  nuevoCostoUnitario: number

  @Column({ name: 'NUEVO_COSTO_LIBRA', type: 'decimal', precision: 28, scale: 8, nullable: true, default: 0 })
  nuevoCostoLibra: number

  @Column({ name: 'COSTO_TOTAL', type: 'decimal', precision: 28, scale: 8, default: 0 })
  costoTotal: number

  @Column({ name: 'ASIGNACION_COSTO', type: 'decimal', precision: 28, scale: 8, default: 0 })
  asignacionCosto: number

  @Column({ name: 'ES_MERMA_RECORTE', default: false })
  esMermaRecorte: boolean
}
