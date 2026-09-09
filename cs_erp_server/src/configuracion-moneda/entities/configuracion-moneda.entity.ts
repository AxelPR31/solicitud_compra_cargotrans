import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'GLOBALES_AS', synchronize: false })
export class ConfiguracionMoneda {
  @PrimaryColumn({ name: 'MONEDA_LOCAL' })
  monedaLocal: string
  @Column({ name: 'MONEDA_DOLAR' })
  monedaDolar: string
  @Column({ name: 'SIMBOLO_MON_FUNC' })
  simboloLocal: string
  @Column({ name: 'SIMBOLO_MON_REP' })
  simboloDolar: string
}
