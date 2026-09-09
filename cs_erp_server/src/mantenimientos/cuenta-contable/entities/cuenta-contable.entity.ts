import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'CUENTA_CONTABLE', synchronize: false })
export class Cuentacontable {
  @PrimaryColumn({ name: 'CUENTA_CONTABLE' })
  cuentacontable: string
  @Column()
  descripcion: string
  @Column()
  tipo: string
  @Column({ name: 'TIPO_DETALLADO' })
  tipodetalle: string
  @Column({ name: 'SALDO_NORMAL' })
  saldonormal: string
  @Column()
  conversion: string
  @Column({ name: 'TIPO_CAMBIO' })
  tipocambio: string
  @Column({ name: 'ACEPTA_DATOS' })
  aceptadatos: string
  @Column({ name: 'USA_CENTRO_COSTO' })
  usacentro: string
  @Column()
  notas: string
}
