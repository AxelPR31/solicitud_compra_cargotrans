import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'MONEDA', synchronize: false })
export class Moneda {
  @PrimaryColumn()
  moneda: string
  @Column()
  nombre: string
}
