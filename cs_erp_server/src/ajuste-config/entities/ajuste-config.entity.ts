import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'AJUSTE_CONFIG', synchronize: false })
export class AjusteConfig {
  @PrimaryColumn({ name: 'AJUSTE_BASE' })
  ajusteBase: string

  @Column({name: 'AJUSTE_CONFIG'})
  ajusteConfig: string

  @Column({ name: 'DESCRIPCION' })
  descripcion: string

  @Column({ name: 'ACTIVA' })
  activa: string
}
