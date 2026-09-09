import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'CENTRO_COSTO', synchronize: false })
export class Centrocosto {
  @PrimaryColumn({ name: 'CENTRO_COSTO' })
  centrocosto: string
  @Column()
  descripcion: string
  @Column({ name: 'ACEPTA_DATOS' })
  aceptadatos: string
}
