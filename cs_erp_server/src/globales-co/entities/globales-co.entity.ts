import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'GLOBALES_CO', synchronize: false })
export class GlobalesCo {
  @PrimaryColumn({ name: 'RowPointer', type: 'uniqueidentifier' })
  rowPointer: string

  @Column({ name: 'ULT_SOLICITUD' })
  ultSolicitud: string

  @Column({ name: 'ULT_ORDEN_COMPRA', nullable: true })
  ultOrdenCompra: string

  @Column({ name: 'USAR_RUBROS', nullable: true })
  usarRubros: string

  @Column({ name: 'RUBRO1_SOLNOM', nullable: true })
  rubro1SolNom: string

  @Column({ name: 'RUBRO2_SOLNOM', nullable: true })
  rubro2SolNom: string

  @Column({ name: 'RUBRO3_SOLNOM', nullable: true })
  rubro3SolNom: string

  @Column({ name: 'RUBRO4_SOLNOM', nullable: true })
  rubro4SolNom: string

  @Column({ name: 'RUBRO5_SOLNOM', nullable: true })
  rubro5SolNom: string

  @Column({ name: 'MAXIMO_LINORDEN', type: 'int', nullable: true })
  maximoLinorden: number

  @Column({ name: 'SUGERIR_FECHA', nullable: true })
  sugerirFecha: string

  @Column({ name: 'PRECIO_DEC', type: 'int', nullable: true })
  precioDec: number

  @Column({ name: 'CANTIDAD_DEC', type: 'int', nullable: true })
  cantidadDec: number

  @Column({ name: 'BODEGA_DEFAULT', nullable: true })
  bodegaDefault: string

  @Column({ name: 'TIPO_CAMBIO', nullable: true })
  tipoCambio: string
}
