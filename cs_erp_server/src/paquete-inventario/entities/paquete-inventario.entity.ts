import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'PAQUETE_INVENTARIO', synchronize: false })
export class PaqueteInventario {
  @PrimaryColumn({ name: 'PAQUETE_INVENTARIO' })
  paqueteInventario: string

  @Column({ name: 'DESCRIPCION' })
  descripcion: string
}
