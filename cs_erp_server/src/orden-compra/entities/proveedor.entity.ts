import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'PROVEEDOR', synchronize: false })
export class Proveedor {
  @PrimaryColumn({ name: 'PROVEEDOR' })
  proveedor: string

  @Column({ name: 'NOMBRE', nullable: true })
  nombre: string | null
}
