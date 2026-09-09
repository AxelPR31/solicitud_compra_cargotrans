import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'ARTICULO', synchronize: false })
export class Articulo {
  @PrimaryColumn({ name: 'ARTICULO' })
  articulo: string

  @Column({ name: 'DESCRIPCION' })
  descripcion: string

  @Column({ name: 'CLASIFICACION_1' })
  clasificacion1: string

  @Column({ name: 'CLASIFICACION_2' })
  clasificacion2: string

  @Column({ name: 'COSTO_PROM_LOC', type: 'decimal', precision: 28, scale: 8 })
  costoPromLoc: number

  @Column({ name: 'COSTO_PROM_DOL', type: 'decimal', precision: 28, scale: 8 })
  costoPromDol: number

  @Column({ name: 'COSTO_STD_LOC', type: 'decimal', precision: 28, scale: 8 })
  costoStdLoc: number

  @Column({ name: 'COSTO_STD_DOL', type: 'decimal', precision: 28, scale: 8 })
  costoStdDol: number

  @Column({ name: 'COSTO_ULT_DOL', type: 'decimal', precision: 28, scale: 8 })
  costoUltDol: number

  @Column({ name: 'COSTO_ULT_LOC', type: 'decimal', precision: 28, scale: 8 })
  costoUltLoc: number

  @Column({ name: 'ACTIVO' })
  activo: string

  @Column({ name: 'UNIDAD_ALMACEN' })
  unidadAlmacen: string

  @Column({ name: 'UNIDAD_EMPAQUE' })
  unidadEmpaque: string

  @Column({ name: 'UNIDAD_VENTA' })
  unidadVenta: string

  @Column({ name: 'ARTICULO_CUENTA', nullable: true })
  articuloCuenta: string
}
