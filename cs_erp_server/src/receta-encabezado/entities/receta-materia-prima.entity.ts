import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'CS_RECETA_MATERIA_PRIMA', synchronize: true })
export class RecetaMateriaPrima {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'RECETA_ID' })
  recetaId: number

  @Column({ name: 'ARTICULO' })
  articulo: string
}
