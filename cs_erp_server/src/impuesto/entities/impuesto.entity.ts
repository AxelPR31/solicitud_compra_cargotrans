import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'IMPUESTO', synchronize: false })
export class Impuesto {
  @PrimaryColumn({ name: 'IMPUESTO' })
  impuesto: string

  @Column({ name: 'DESCRIPCION' })
  descripcion: string

  @Column({ name: 'IMPUESTO1', type: 'decimal' })
  impuesto1: number
}
