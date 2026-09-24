import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'SOLICITUD_OC_LINEA', synchronize: false })
export class SolicitudOcLinea {
  @PrimaryColumn({ name: 'SOLICITUD_OC' })
  solicitudOc: string

  @PrimaryColumn({ name: 'SOLICITUD_OC_LINEA', type: 'int' })
  solicitudOcLinea: number

  @Column({ name: 'USUARIO_CANCELA', nullable: true })
  usuarioCancela: string

  @Column({ name: 'ARTICULO' })
  articulo: string

  @Column({ name: 'DESCRIPCION', nullable: true })
  descripcion: string

  @Column({ name: 'CANTIDAD', type: 'decimal', precision: 28, scale: 8 })
  cantidad: number

  @Column({ name: 'SALDO', type: 'decimal', precision: 28, scale: 8 })
  saldo: number

  @Column({ name: 'ESTADO' })
  estado: string

  @Column({ name: 'COMENTARIO', nullable: true })
  comentario: string

  @Column({ name: 'U_ESPECIFICACION', nullable: true, length: 150 })
  especificacion: string

  @Column({ name: 'FECHA_REQUERIDA', type: 'datetime', nullable: true })
  fechaRequerida: Date

  @Column({ name: 'UNIDAD_DISTRIBUCIO', nullable: true })
  unidadDistribucio: string

  @Column({ name: 'FECHA_HORA_CANCELA', type: 'datetime', nullable: true })
  fechaHoraCancela: Date

  @Column({ name: 'CENTRO_COSTO', nullable: true })
  centroCosto: string

  @Column({ name: 'CUENTA_CONTABLE', nullable: true })
  cuentaContable: string

  @Column({ name: 'E_MAIL', nullable: true })
  eMail: string

  @Column({ name: 'FASE', nullable: true })
  fase: string

  @Column({ name: 'PROYECTO', nullable: true })
  proyecto: string

  @Column({ name: 'ORDEN_CAMBIO', nullable: true })
  ordenCambio: string

  @Column({ name: 'CreatedBy', nullable: true })
  createdBy: string

  @Column({ name: 'UpdatedBy', nullable: true })
  updatedBy: string

  @Column({ name: 'CreateDate', type: 'datetime', nullable: true })
  createDate: Date

  @Column({ name: 'RecordDate', type: 'datetime', nullable: true })
  recordDate: Date
}
