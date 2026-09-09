import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'BODEGA', synchronize: false })
export class Bodega {
  @PrimaryColumn({ name: 'BODEGA' })
  bodega: string

  @Column({ name: 'NOMBRE' })
  nombre: string
}
