import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'ORDEN_COMPRA', synchronize: false })
export class OrdenCompra {
  @PrimaryColumn({ name: 'ORDEN_COMPRA' })
  ordenCompra: string

  @Column({ name: 'USUARIO', nullable: true })
  usuario: string | null

  @Column({ name: 'PROVEEDOR' })
  proveedor: string

  @Column({ name: 'BODEGA' })
  bodega: string

  @Column({ name: 'CONDICION_PAGO' })
  condicionPago: string

  @Column({ name: 'MONEDA' })
  moneda: string

  @Column({ name: 'DEPARTAMENTO', nullable: true })
  departamento: string | null

  @Column({ name: 'FECHA', type: 'datetime' })
  fecha: Date

  @Column({ name: 'FECHA_COTIZACION', type: 'datetime', nullable: true })
  fechaCotizacion: Date | null

  @Column({ name: 'FECHA_REQUERIDA', type: 'datetime' })
  fechaRequerida: Date

  @Column({ name: 'TOTAL_MERCADERIA', type: 'decimal', precision: 28, scale: 8 })
  totalMercaderia: number

  @Column({ name: 'TOTAL_IMPUESTO1', type: 'decimal', precision: 28, scale: 8 })
  totalImpuesto1: number

  @Column({ name: 'MONTO_DESCUENTO', type: 'decimal', precision: 28, scale: 8, nullable: true })
  montoDescuento: number | null

  @Column({ name: 'TOTAL_A_COMPRAR', type: 'decimal', precision: 28, scale: 8 })
  totalAComprar: number

  @Column({ name: 'PRIORIDAD' })
  prioridad: string

  @Column({ name: 'ESTADO' })
  estado: string

  @Column({ name: 'INSTRUCCIONES', nullable: true })
  instrucciones: string | null

  @Column({ name: 'OBSERVACIONES', type: 'text', nullable: true })
  observaciones: string | null

  @Column({ name: 'CONFIRMADA' })
  confirmada: string

  @Column({ name: 'USUARIO_CONFIRMA', nullable: true })
  usuarioConfirma: string | null

  @Column({ name: 'FECHA_HORA_CONFIR', type: 'datetime', nullable: true })
  fechaHoraConfir: Date | null

  @Column({ name: 'FECHA_HORA', type: 'datetime' })
  fechaHora: Date
}
