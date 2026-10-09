import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { CS_DB_SCHEMA } from '../../cs-database/cs-connection'
import { CsSolicitudOc } from './cs-solicitud-oc.entity'

@Entity({ schema: CS_DB_SCHEMA, name: 'CS_SOLICITUD_OC_LINEA' })
export class CsSolicitudOcLinea {
  @PrimaryColumn({ name: 'CS_SOLICITUD_ID', type: 'int' })
  csSolicitudId: number

  @PrimaryColumn({ name: 'LINEA', type: 'int' })
  linea: number

  @ManyToOne(() => CsSolicitudOc, solicitud => solicitud.lineas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'CS_SOLICITUD_ID' })
  solicitud: CsSolicitudOc

  @Column({ name: 'ARTICULO' })
  articulo: string

  @Column({ name: 'DESCRIPCION', nullable: true })
  descripcion: string | null

  @Column({ name: 'CANTIDAD', type: 'decimal', precision: 28, scale: 8 })
  cantidad: number

  @Column({ name: 'COMENTARIO', nullable: true })
  comentario: string | null

  @Column({ name: 'U_ESPECIFICACION', nullable: true, length: 150 })
  especificacion: string | null

  @Column({ name: 'FECHA_REQUERIDA', type: 'datetime', nullable: true })
  fechaRequerida: Date | null

  @Column({ name: 'CENTRO_COSTO', nullable: true })
  centroCosto: string | null

  @Column({ name: 'CUENTA_CONTABLE', nullable: true })
  cuentaContable: string | null

  @Column({ name: 'FASE', nullable: true })
  fase: string | null

  @Column({ name: 'PROYECTO', nullable: true })
  proyecto: string | null
}
