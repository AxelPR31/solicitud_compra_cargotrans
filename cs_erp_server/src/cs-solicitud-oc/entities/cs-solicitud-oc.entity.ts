import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { CsWorkflowEstado } from '../types/cs-workflow-estado.type'
import { CsSolicitudOcLinea } from './cs-solicitud-oc-linea.entity'
import { CS_DB_SCHEMA } from '../../cs-database/cs-connection'
import { PrioridadSolicitudOc } from '../../solicitud-oc/types/prioridad-solicitud-oc.type'

@Entity({ schema: CS_DB_SCHEMA, name: 'CS_SOLICITUD_OC' })
export class CsSolicitudOc {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number

  @Column({ name: 'WORKFLOW_ESTADO', length: 20 })
  workflowEstado: CsWorkflowEstado

  @Column({ name: 'SOLICITUD_OC_SOFTLAND', nullable: true })
  solicitudOcSoftland: string | null

  @Column({ name: 'DEPARTAMENTO' })
  departamento: string

  @Column({ name: 'FECHA_SOLICITUD', type: 'datetime' })
  fechaSolicitud: Date

  @Column({ name: 'FECHA_REQUERIDA', type: 'datetime' })
  fechaRequerida: Date

  @Column({ name: 'PRIORIDAD', nullable: true })
  prioridad: PrioridadSolicitudOc

  @Column({ name: 'COMENTARIO', nullable: true })
  comentario: string | null

  @Column({ name: 'USUARIO_SOLICITA', nullable: true })
  usuarioSolicita: string | null

  @Column({ name: 'FECHA_HORA_SOLICITUD', type: 'datetime', nullable: true })
  fechaHoraSolicitud: Date | null

  @Column({ name: 'USUARIO_APROBO', nullable: true })
  usuarioAprobo: string | null

  @Column({ name: 'FECHA_APROBACION', type: 'datetime', nullable: true })
  fechaAprobacion: Date | null

  @Column({ name: 'MOTIVO_RECHAZO', nullable: true, length: 500 })
  motivoRechazo: string | null

  @Column({ name: 'RUBRO1', nullable: true })
  rubro1: string | null

  @Column({ name: 'RUBRO2', nullable: true })
  rubro2: string | null

  @Column({ name: 'RUBRO3', nullable: true })
  rubro3: string | null

  @Column({ name: 'RUBRO4', nullable: true })
  rubro4: string | null

  @Column({ name: 'RUBRO5', nullable: true })
  rubro5: string | null

  @Column({ name: 'U_PLACA', nullable: true, length: 150 })
  placa: string | null

  @Column({ name: 'U_CHASIS', nullable: true, length: 150 })
  chasis: string | null

  @Column({ name: 'U_MARCA', nullable: true, length: 150 })
  marca: string | null

  @Column({ name: 'U_MODELO', nullable: true, length: 150 })
  modelo: string | null

  @Column({ name: 'CreatedBy', nullable: true })
  createdBy: string | null

  @Column({ name: 'UpdatedBy', nullable: true })
  updatedBy: string | null

  @Column({ name: 'CreateDate', type: 'datetime', nullable: true })
  createDate: Date | null

  @Column({ name: 'RecordDate', type: 'datetime', nullable: true })
  recordDate: Date | null

  @OneToMany(() => CsSolicitudOcLinea, linea => linea.solicitud, {
    cascade: true,
  })
  lineas?: CsSolicitudOcLinea[]
}
