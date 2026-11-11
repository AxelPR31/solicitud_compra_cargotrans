import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'ORDEN_COMPRA_LINEA', synchronize: false })
export class OrdenCompraLinea {
  @PrimaryColumn({ name: 'ORDEN_COMPRA' })
  ordenCompra: string

  @PrimaryColumn({ name: 'ORDEN_COMPRA_LINEA', type: 'smallint' })
  ordenCompraLinea: number

  @Column({ name: 'ARTICULO' })
  articulo: string

  @Column({ name: 'BODEGA' })
  bodega: string

  @Column({ name: 'DESCRIPCION', type: 'text', nullable: true })
  descripcion: string | null

  @Column({ name: 'CANTIDAD_ORDENADA', type: 'decimal', precision: 28, scale: 8 })
  cantidadOrdenada: number

  @Column({ name: 'PRECIO_UNITARIO', type: 'decimal', precision: 28, scale: 8 })
  precioUnitario: number

  @Column({ name: 'IMPUESTO1', type: 'decimal', precision: 28, scale: 8 })
  impuesto1: number

  @Column({ name: 'MONTO_DESCUENTO', type: 'decimal', precision: 28, scale: 8 })
  montoDescuento: number

  @Column({ name: 'ESTADO' })
  estado: string

  @Column({ name: 'COMENTARIO', nullable: true })
  comentario: string | null

  @Column({ name: 'FECHA_REQUERIDA', type: 'datetime' })
  fechaRequerida: Date

  @Column({ name: 'UNIDAD_DISTRIBUCIO', nullable: true })
  unidadDistribucio: string | null

  @Column({ name: 'CENTRO_COSTO', nullable: true })
  centroCosto: string | null

  @Column({ name: 'CUENTA_CONTABLE', nullable: true })
  cuentaContable: string | null
}
