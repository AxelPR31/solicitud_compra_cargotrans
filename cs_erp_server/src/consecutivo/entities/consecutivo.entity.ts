import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'CONSECUTIVO', synchronize: false })
export class Consecutivo {
  @PrimaryColumn()
  consecutivo: string
  @PrimaryColumn()
  documento: string
  @Column()
  activo: string
  @Column({ name: 'ULTIMO_VALOR' })
  ultimoValor: string
  @Column()
  mascara: string
  @Column({ name: 'ENTIDAD' })
  entidad: string
  @Column({ name: 'DESCRIPCION' })
  descripcion: string
}
