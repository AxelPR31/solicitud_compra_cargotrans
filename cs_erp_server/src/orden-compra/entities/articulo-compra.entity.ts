import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'ARTICULO_COMPRA', synchronize: false })
export class ArticuloCompra {
  @PrimaryColumn({ name: 'ARTICULO' })
  articulo: string

  @Column({ name: 'ULT_PROVEEDOR', nullable: true })
  ultProveedor: string | null

  @Column({ name: 'ULT_MONEDA', nullable: true })
  ultMoneda: string | null

  @Column({ name: 'ULT_PREC_UNITARIO', type: 'decimal', precision: 28, scale: 8, nullable: true })
  ultPrecUnitario: number | null

  @Column({ name: 'ULT_FECHA_COTIZA', type: 'datetime', nullable: true })
  ultFechaCotiza: Date | null
}
