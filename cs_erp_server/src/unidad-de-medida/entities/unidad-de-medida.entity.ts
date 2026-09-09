import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'UNIDAD_DE_MEDIDA', synchronize: false })
export class UnidadDeMedida {
  @PrimaryColumn({ name: 'UNIDAD_MEDIDA' })
  unidadMedida: string

  @Column({ name: 'DESCRIPCION' })
  descripcion: string
}
