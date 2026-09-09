import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'EXISTENCIA_BODEGA', synchronize: false })
export class ExistenciaBodega {
  @PrimaryColumn({ name: 'ARTICULO' })
  articulo: string

  @PrimaryColumn({ name: 'BODEGA' })
  bodega: string

  @Column({ name: 'EXISTENCIA_MINIMA', type: 'decimal', precision: 28, scale: 8 })
  existenciaMinima: number

  @Column({ name: 'EXISTENCIA_MAXIMA', type: 'decimal', precision: 28, scale: 8 })
  existenciaMaxima: number

  @Column({ name: 'CANT_DISPONIBLE', type: 'decimal', precision: 28, scale: 8 })
  cantDisponible: number

  @Column({ name: 'CANT_RESERVADA', type: 'decimal', precision: 28, scale: 8 })
  cantReservada: number

  @Column({ name: 'CANT_NO_APROBADA', type: 'decimal', precision: 28, scale: 8 })
  cantNoAprobada: number

  @Column({ name: 'CANT_VENCIDA', type: 'decimal', precision: 28, scale: 8 })
  cantVencida: number

  @Column({ name: 'CANT_TRANSITO', type: 'decimal', precision: 28, scale: 8 })
  cantTransito: number

  @Column({ name: 'CANT_PRODUCCION', type: 'decimal', precision: 28, scale: 8 })
  cantProduccion: number

  @Column({ name: 'CANT_PEDIDA', type: 'decimal', precision: 28, scale: 8 })
  cantPedida: number

  @Column({ name: 'CANT_REMITIDA', type: 'decimal', precision: 28, scale: 8 })
  cantRemitida: number

  @Column({ name: 'COSTO_UNT_PROMEDIO_LOC', type: 'decimal', precision: 28, scale: 8 })
  costoUntPromedioLoc: number

  @Column({ name: 'COSTO_UNT_PROMEDIO_DOL', type: 'decimal', precision: 28, scale: 8 })
  costoUntPromedioDol: number

  @Column({ name: 'COSTO_UNT_ESTANDAR_LOC', type: 'decimal', precision: 28, scale: 8 })
  costoUntEstandarLoc: number

  @Column({ name: 'COSTO_UNT_ESTANDAR_DOL', type: 'decimal', precision: 28, scale: 8 })
  costoUntEstandarDol: number
}
