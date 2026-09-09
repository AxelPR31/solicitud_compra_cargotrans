import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ schema: 'CEPENAD', name: 'CUENTA_BANCARIA', synchronize: false })
export class CuentaBancaria {
  @PrimaryColumn({ name: 'CUENTA_BANCO' })
  cuentaBanco: string
  @Column()
  nombre: string
  @Column({ name: 'ENTIDAD_FINANCIERA' })
  entidad: string
  @Column()
  moneda: string
  @Column({ name: 'U_CENTRO_COSTO' })
  centroCosto: string

  @Column({name: 'CTA_CONTABLE'})
  cuentaContable : string

  @Column({ name: 'SALDO', type: 'decimal', precision: 28, scale: 8 })
  saldo: number

  @Column({ name: 'POSICION_DE_CAJA', type: 'decimal', precision: 28, scale: 8 })
  posicionDeCaja: number
}
