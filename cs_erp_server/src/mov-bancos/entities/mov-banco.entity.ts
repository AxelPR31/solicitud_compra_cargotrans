import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ schema: 'CEPENAD', name: 'MOV_BANCOS', synchronize: false })
export class MovBanco {
  @PrimaryColumn({ name: 'CUENTA_BANCO' })
  cuentaBanco: string

  @PrimaryColumn({ name: 'TIPO_DOCUMENTO' })
  tipoDocumento: string

  @PrimaryColumn({ name: 'NUMERO', type: 'decimal' })
  numero: number

  @Column({ name: 'FECHA', type: 'datetime' })
  fecha: Date

  @Column({ name: 'PAGADERO_A' })
  pagaderoA: string

  @Column({ name: 'REFERENCIA' })
  referencia: string

  @Column({ name: 'MONTO', type: 'decimal', precision: 28, scale: 8 })
  monto: number

  @Column({ name: 'ORIGEN' })
  origen: string

  @Column({ name: 'ASIENTO' })
  asiento: string

  @Column({ name: 'ANULADO' })
  anulado: string

  @Column({ name: 'CONFIRMADO' })
  confirmado: string

  @Column({ name: 'FCH_HORA_CREACION', type: 'datetime' })
  fchHoraCreacion: Date

  @Column({ name: 'USUARIO_CREACION' })
  usuarioCreacion: string

  @Column({ name: 'ESTADO' })
  estado: string

  // Campos de anulación (cuando se revierte un movimiento por update/delete del documento origen)
  @Column({ name: 'USUARIO_ANULADO', nullable: true })
  usuarioAnulado?: string | null

  @Column({ name: 'REFERENCIA_ANULADO', nullable: true })
  referenciaAnulado?: string | null

  @Column({ name: 'CLASE_DIF' })
  claseDif: string

  @Column({ name: 'ACLARADA_DIF' })
  aclaradaDif: string

  @Column({ name: 'CLASE_DOCUMENTO' })
  claseDocumento: string

  @Column({ name: 'MODO_REGISTRO' })
  modoRegistro: string

  @Column({ name: 'LIQUIDADO' })
  liquidado: string

  @Column({
    name: 'TIPO_CAMBIO_DOLAR',
    type: 'decimal',
    precision: 28,
    scale: 8,
  })
  tipoCambioDolar: number

  @Column({
    name: 'TIPO_CAMBIO_LOCAL',
    type: 'decimal',
    precision: 28,
    scale: 8,
  })
  tipoCambioLocal: number

  @Column({ name: 'APROBADO' })
  aprobado: string

  // Alias para mantener compatibilidad con código existente.
  get tipocambio(): number {
    return this.tipoCambioLocal
  }

  set tipocambio(value: number) {
    this.tipoCambioLocal = value
  }

  @Column()
  detalle: string

  @Column()
  validado: string

  @Column()
  caja: string
}

