import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm'

const DB_SCHEMA =
  process.env.DATABASE_SCHEMA ?? process.env.DATABASE_NAME ?? 'CEPENAD'

@Entity({ schema: DB_SCHEMA, name: 'ASIENTO_MAYORIZADO', synchronize: false })
export class AsientoMayorizado {
  @PrimaryColumn({ type: 'varchar', length: 10, name: 'ASIENTO' })
  asiento: string

  @Column({ type: 'int', name: 'MAYOR_AUDITORIA' })
  mayorAuditoria: number

  @Column({ type: 'varchar', length: 4, name: 'TIPO_ASIENTO' })
  tipoAsiento: string

  @Column({ type: 'datetime', name: 'FECHA' })
  fecha: Date

  @Column({ type: 'varchar', length: 1, name: 'CONTABILIDAD' })
  contabilidad: string

  @Column({ type: 'varchar', length: 4, name: 'ORIGEN' })
  origen: string

  @Column({ type: 'varchar', length: 1, name: 'CLASE_ASIENTO' })
  claseAsiento: string

  @Column({ type: 'varchar', length: 50, name: 'ULTIMO_USUARIO' })
  ultimoUsuario: string

  @Column({
    type: 'decimal',
    precision: 28,
    scale: 8,
    name: 'MONTO_TOTAL_LOCAL',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  montoTotalLocal: number

  @Column({
    type: 'decimal',
    precision: 28,
    scale: 8,
    name: 'MONTO_TOTAL_DOLAR',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  montoTotalDolar: number

  @Column({ type: 'text', nullable: true, name: 'NOTAS' })
  notas: string

  @Column({ type: 'varchar', length: 50, name: 'USUARIO_CREACION' })
  usuarioCreacion: string

  @CreateDateColumn({ type: 'datetime', name: 'FECHA_CREACION' })
  fechaCreacion: Date

  @CreateDateColumn({ type: 'datetime', name: 'FECHA_ULT_MODIF' })
  fechaUltModif: Date

  @Column({ type: 'varchar', length: 1, name: 'EXPORTADO' })
  exportado: string

  @Column({ type: 'varchar', length: 1, name: 'TIPO_INGRESO_MAYOR' })
  tipoIngresoMayor: string
}

