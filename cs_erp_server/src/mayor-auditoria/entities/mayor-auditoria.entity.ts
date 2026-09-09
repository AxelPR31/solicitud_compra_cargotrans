import { Column, Entity, PrimaryColumn } from 'typeorm'

const DB_SCHEMA =
  process.env.DATABASE_SCHEMA ?? process.env.DATABASE_NAME ?? 'CEPENAD'

@Entity({ schema: DB_SCHEMA, name: 'MAYOR_AUDITORIA', synchronize: false })
export class MayorAuditoria {
  @PrimaryColumn({ type: 'int', name: 'MAYOR_AUDITORIA' })
  mayorAuditoria: number

  @Column({ type: 'varchar', length: 50, name: 'USUARIO' })
  usuario: string

  @Column({ type: 'datetime', name: 'FECHA' })
  fecha: Date

  @Column({ type: 'varchar', length: 40, name: 'COMENTARIO' })
  comentario: string

  @Column({ type: 'tinyint', name: 'NoteExistsFlag', default: () => '(0)' })
  noteExistsFlag: number

  @Column({
    type: 'datetime',
    name: 'RecordDate',
    default: () => '[ERPADMIN].[SF_GETDATE]()',
  })
  recordDate: Date

  @Column({
    type: 'uniqueidentifier',
    name: 'RowPointer',
    default: () => 'newid()',
  })
  rowPointer: string

  @Column({
    type: 'varchar',
    length: 50,
    name: 'CreatedBy',
    default: () => 'suser_sname()',
  })
  createdBy: string

  @Column({
    type: 'varchar',
    length: 50,
    name: 'UpdatedBy',
    default: () => 'suser_sname()',
  })
  updatedBy: string

  @Column({
    type: 'datetime',
    name: 'CreateDate',
    default: () => '[ERPADMIN].[SF_GETDATE]()',
  })
  createDate: Date
}

