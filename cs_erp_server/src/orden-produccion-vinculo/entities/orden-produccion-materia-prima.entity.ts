import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'CS_ORDEN_PRODUCCION_MATERIA_PRIMA', synchronize: true })
export class OrdenProduccionMateriaPrima {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'VINCULO_ID' })
  vinculoId: number

  @Column({ name: 'ARTICULO' })
  articulo: string

  @Column({ name: 'CANTIDAD', type: 'decimal', precision: 28, scale: 8, default: 0 })
  cantidad: number

  @Column({ name: 'COSTO_UNITARIO', type: 'decimal', precision: 28, scale: 8, default: 0 })
  costoUnitario: number

  @Column({ name: 'COSTO_TOTAL', type: 'decimal', precision: 28, scale: 8, default: 0 })
  costoTotal: number
}
