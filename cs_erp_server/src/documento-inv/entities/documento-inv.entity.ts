import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'DOCUMENTO_INV', synchronize: false })
export class DocumentoInv {
  @PrimaryColumn({ name: 'PAQUETE_INVENTARIO' })
  paqueteInventario: string

  @PrimaryColumn({ name: 'DOCUMENTO_INV' })
  documentoInv: string

  @Column({ name: 'CONSECUTIVO' })
  consecutivo: string

  @Column({ name: 'REFERENCIA' })
  referencia: string

  @Column({ name: 'FECHA_DOCUMENTO', type: 'datetime' })
  fechaDocumento: Date

  @Column({ name: 'FECHA_HOR_CREACION', type: 'datetime' })
  fechaHorCreacion: Date

  @Column({ name: 'SELECCIONADO' })
  seleccionado: string

  @Column({ name: 'USUARIO' })
  usuario: string
}
