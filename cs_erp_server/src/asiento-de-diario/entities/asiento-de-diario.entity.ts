import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'ASIENTO_DE_DIARIO', synchronize: false })
export class AsientoDeDiario {
  @PrimaryColumn({ name: 'ASIENTO' })
  asiento: string

  @Column({ name: 'PAQUETE' })
  paquete: string

  @Column({ name: 'TIPO_ASIENTO' })
  tipoAsiento: string

  @Column({ name: 'FECHA', type: 'datetime' })
  fecha: Date

  @Column({ name: 'CONTABILIDAD' })
  contabilidad: string

  @Column({ name: 'ORIGEN' })
  origen: string

  @Column({ name: 'CLASE_ASIENTO' })
  claseAsiento: string

  @Column({ name: 'NOTAS' })
  notas: string

  @Column({
    name: 'TOTAL_DEBITO_LOC',
    type: 'decimal',
    precision: 28,
    scale: 8,
  })
  totalDebitoLoc: number

  @Column({
    name: 'TOTAL_DEBITO_DOL',
    type: 'decimal',
    precision: 28,
    scale: 8,
  })
  totalDebitoDol: number

  @Column({
    name: 'TOTAL_CREDITO_DOL',
    type: 'decimal',
    precision: 28,
    scale: 8,
  })
  totalCreditoDol: number

  @Column({
    name: 'TOTAL_CREDITO_LOC',
    type: 'decimal',
    precision: 28,
    scale: 8,
  })
  totalCreditoLoc: number

  @Column({ name: 'ULTIMO_USUARIO' })
  ultimoUsuario: string

  @Column({ name: 'FECHA_ULT_MODIF', type: 'datetime' })
  fechaUltModif: Date

  @Column({ name: 'MARCADO' })
  marcado: string

  @Column({
    name: 'TOTAL_CONTROL_LOC',
    type: 'decimal',
    precision: 28,
    scale: 8,
  })
  totalControlLoc: number

  @Column({
    name: 'TOTAL_CONTROL_DOL',
    type: 'decimal',
    precision: 28,
    scale: 8,
  })
  totalControlDol: number

  @Column({ name: 'USUARIO_CREACION' })
  usuarioCreacion: string

  @Column({ name: 'FECHA_CREACION', type: 'datetime' })
  fechaCreacion: Date
}

