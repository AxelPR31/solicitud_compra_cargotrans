import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'DIARIO', synchronize: false })
export class Diario {
  @PrimaryColumn({ name: 'ASIENTO' })
  asiento: string

  @PrimaryColumn({ name: 'CONSECUTIVO' })
  consecutivo: number

  @Column({ name: 'CENTRO_COSTO' })
  centroCosto: string

  @Column({ name: 'CUENTA_CONTABLE' })
  cuentaContable: string

  @Column({ name: 'FUENTE' })
  fuente: string

  @Column({ name: 'REFERENCIA' })
  referencia: string

  @Column({ name: 'DEBITO_LOCAL', type: 'decimal', nullable: true, precision: 28, scale: 8 })
  debitoLocal: number | null

  @Column({ name: 'DEBITO_DOLAR', type: 'decimal', nullable: true, precision: 28, scale: 8 })
  debitoDolar: number | null

  @Column({ name: 'CREDITO_LOCAL', type: 'decimal', nullable: true, precision: 28, scale: 8 })
  creditoLocal: number | null

  @Column({ name: 'CREDITO_DOLAR', type: 'decimal', nullable: true, precision: 28, scale: 8 })
  creditoDolar: number | null
}
