import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'SUBTIPO_DOC_CB', synchronize: false })
export class SubtipoDocCb {
  @PrimaryColumn({ name: 'TIPO' })
  tipo: string

  @Column({ name: 'DESCRIPCION' })
  descripcion: string
}
