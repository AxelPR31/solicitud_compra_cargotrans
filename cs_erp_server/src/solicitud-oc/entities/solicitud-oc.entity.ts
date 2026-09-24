import { Column, Entity, PrimaryColumn } from 'typeorm'
import { PrioridadSolicitudOc } from '../types/prioridad-solicitud-oc.type'
import { EstadoSolicitudOc } from '../types/estado-solicitud-oc.type'

@Entity({ name: 'SOLICITUD_OC', synchronize: false })
export class SolicitudOc {
  @PrimaryColumn({ name: 'SOLICITUD_OC' })
  solicitudOc: string

  @Column({ name: 'DEPARTAMENTO' })
  departamento: string

  @Column({ name: 'FECHA_SOLICITUD', type: 'datetime' })
  fechaSolicitud: Date

  @Column({ name: 'FECHA_REQUERIDA', type: 'datetime' })
  fechaRequerida: Date

  @Column({ name: 'AUTORIZADA_POR', nullable: true })
  autorizadaPor: string

  @Column({ name: 'FECHA_AUTORIZADA', type: 'datetime', nullable: true })
  fechaAutorizada: Date

  @Column({ name: 'PRIORIDAD', nullable: true })
  prioridad: PrioridadSolicitudOc

  @Column({ name: 'LINEAS_NO_ASIG', type: 'int', nullable: true })
  lineasNoAsig: number

  @Column({ name: 'ESTADO' })
  estado: EstadoSolicitudOc

  @Column({ name: 'COMENTARIO', nullable: true })
  comentario: string

  @Column({ name: 'FECHA_HORA', type: 'datetime', nullable: true })
  fechaHora: Date

  @Column({ name: 'USUARIO', nullable: true })
  usuario: string

  @Column({ name: 'USUARIO_CANCELA', nullable: true })
  usuarioCancela: string

  @Column({ name: 'FECHA_HORA_CANCELA', type: 'datetime', nullable: true })
  fechaHoraCancela: Date

  @Column({ name: 'RUBRO1', nullable: true })
  rubro1: string

  @Column({ name: 'RUBRO2', nullable: true })
  rubro2: string

  @Column({ name: 'RUBRO3', nullable: true })
  rubro3: string

  @Column({ name: 'RUBRO4', nullable: true })
  rubro4: string

  @Column({ name: 'RUBRO5', nullable: true })
  rubro5: string

  @Column({ name: 'U_PLACA', nullable: true, length: 150 })
  placa: string

  @Column({ name: 'U_CHASIS', nullable: true, length: 150 })
  chasis: string

  @Column({ name: 'U_MARCA', nullable: true, length: 150 })
  marca: string

  @Column({ name: 'U_MODELO', nullable: true, length: 150 })
  modelo: string

  @Column({ name: 'CreatedBy', nullable: true })
  createdBy: string

  @Column({ name: 'UpdatedBy', nullable: true })
  updatedBy: string

  @Column({ name: 'CreateDate', type: 'datetime', nullable: true })
  createDate: Date

  @Column({ name: 'RecordDate', type: 'datetime', nullable: true })
  recordDate: Date
}
