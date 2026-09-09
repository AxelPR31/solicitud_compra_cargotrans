import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'CS_RECETA_ENCABEZADO', synchronize: true })
export class RecetaEncabezado {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'ARTICULO_MATERIA_PRIMA' })
  articuloMateriaPrima: string

  @Column({ name: 'DESCRIPCION' })
  descripcion: string

  @Column({ name: 'ESTADO' })
  estado: string
}
