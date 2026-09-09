import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'CS_TRASLADO_INTERNO_ENCABEZADO', synchronize: true })
export class TrasladoInternoEncabezado {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'BODEGA_ORIGEN' })
  bodegaOrigen: string

  @Column({ name: 'BODEGA_DESTINO' })
  bodegaDestino: string

  @Column({ name: 'FECHA', type: 'datetime' })
  fecha: Date

  @Column({ name: 'ESTADO', default: 'Pendiente' })
  estado: string // 'Pendiente', 'Aprobado', 'Rechazado'

  @Column({ name: 'REFERENCIA', nullable: true })
  referencia: string

  @Column({ name: 'USUARIO' })
  usuario: string

  @Column({ name: 'DOCUMENTO_INV_SOFTLAND', nullable: true })
  documentoInvSoftland: string // e.g. TR0000000004 or similar, once approved

  @Column({ name: 'CENTRO_COSTO', nullable: true })
  centroCosto: string

  @Column({ name: 'CUENTA_CONTABLE', nullable: true })
  cuentaContable: string

  @Column({ name: 'NUMERO_DOCUMENTO', nullable: true })
  numeroDocumento: string
}
