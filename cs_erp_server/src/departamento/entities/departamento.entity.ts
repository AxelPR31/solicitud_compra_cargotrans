import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'DEPARTAMENTO', synchronize: false })
export class Departamento {
  @PrimaryColumn({ name: 'DEPARTAMENTO' })
  departamento: string

  @Column({ name: 'DESCRIPCION', nullable: true })
  descripcion: string

  @Column({ name: 'JEFE', nullable: true })
  jefe: string

  @Column({ name: 'ACTIVO' })
  activo: string
}
