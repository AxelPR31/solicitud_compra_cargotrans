import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'CS_TRASLADO_INTERNO_DETALLE', synchronize: true })
export class TrasladoInternoDetalle {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'TRASLADO_INTERNO_ID' })
  trasladoInternoId: number

  @Column({ name: 'ARTICULO' })
  articulo: string

  @Column({ name: 'DESCRIPCION' })
  descripcion: string

  @Column({ name: 'TMP_VD', nullable: true })
  tmpVd: string // e.g. "1-2 D"

  @Column({ name: 'OZ', type: 'decimal', precision: 18, scale: 4, nullable: true })
  oz: number // e.g. 12

  @Column({ name: 'UNIDAD', type: 'decimal', precision: 18, scale: 4, nullable: true })
  unidad: number // e.g. 10

  @Column({ name: 'LB', type: 'decimal', precision: 18, scale: 4, nullable: true })
  lb: number // e.g. 7.85

  @Column({ name: 'UNIDAD_MEDIDA', nullable: true })
  unidadMedida: string // e.g. 'UN', 'LBS'

  @Column({ name: 'COSTO_UNITARIO', type: 'decimal', precision: 18, scale: 4, default: 0 })
  costoUnitario: number // cost per unit

  @Column({ name: 'COSTO_TOTAL', type: 'decimal', precision: 18, scale: 4, default: 0 })
  costoTotal: number // total cost
}
