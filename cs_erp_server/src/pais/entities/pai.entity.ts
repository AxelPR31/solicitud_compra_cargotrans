import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'PAIS', synchronize: false })
export class Pai {
  @PrimaryColumn()
  pais: string
  @Column()
  nombre: string
}
