import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'ARTICULO_CUENTA', synchronize: false })
export class ArticuloCuenta {
  @PrimaryColumn({ name: 'ARTICULO_CUENTA' })
  articuloCuenta: string

  @Column({ name: 'DESCRIPCION', nullable: true })
  descripcion: string

  @Column({ name: 'CTA_INVENTARIO', nullable: true })
  ctaInventario: string
}
