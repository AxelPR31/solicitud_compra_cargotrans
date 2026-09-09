import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'LINEA_DOC_INV', synchronize: false })
export class LineaDocInv {
  @PrimaryColumn({ name: 'PAQUETE_INVENTARIO' })
  paqueteInventario: string

  @PrimaryColumn({ name: 'DOCUMENTO_INV' })
  documentoInv: string

  @PrimaryColumn({ name: 'LINEA_DOC_INV' })
  lineaDocInv: number

  @Column({ name: 'AJUSTE_CONFIG' })
  ajusteConfig: string

  @Column({ name: 'NIT' })
  nit: string

  @Column({ name: 'ARTICULO' })
  articulo: string

  @Column({ name: 'BODEGA' })
  bodega: string

  @Column({ name: 'LOCALIZACION' })
  localizacion: string

  @Column({ name: 'LOTE' })
  lote: string

  @Column({ name: 'TIPO' })
  tipo: string

  @Column({ name: 'SUBTIPO' })
  subtipo: string

  @Column({ name: 'SUBSUBTIPO' })
  subsubtipo: string

  @Column({ name: 'CANTIDAD', type: 'decimal', precision: 28, scale: 8 })
  cantidad: number

  @Column({ name: 'COSTO_TOTAL_LOCAL', type: 'decimal', precision: 28, scale: 8 })
  costoTotalLocal: number

  @Column({ name: 'COSTO_TOTAL_DOLAR', type: 'decimal', precision: 28, scale: 8 })
  costoTotalDolar: number

  @Column({ name: 'PRECIO_TOTAL_LOCAL', type: 'decimal', precision: 28, scale: 8 })
  precioTotalLocal: number

  @Column({ name: 'PRECIO_TOTAL_DOLAR', type: 'decimal', precision: 28, scale: 8 })
  precioTotalDolar: number

  @Column({ name: 'BODEGA_DESTINO' })
  bodegaDestino: string

  @Column({ name: 'CENTRO_COSTO' })
  centroCosto: string

  @Column({ name: 'CUENTA_CONTABLE' })
  cuentaContable: string

  @Column({ name: 'COSTO_TOTAL_LOCAL_COMP', type: 'decimal', precision: 28, scale: 8 })
  costoTotalLocalComp: number

  @Column({ name: 'COSTO_TOTAL_DOLAR_COMP', type: 'decimal', precision: 28, scale: 8 })
  costoTotalDolarComp: number
}
