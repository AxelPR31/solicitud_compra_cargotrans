import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'CS_RECETA_DETALLE', synchronize: true })
export class RecetaDetalle {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'RECETA_ID' })
  recetaId: number

  @Column({ name: 'ARTICULO_TERMINADO' })
  articuloTerminado: string

  @Column({ name: 'ES_MERMA_RECORTE' })
  esMermaRecorte: boolean
}
