import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'CONSECUTIVO_CI', synchronize: false })
export class ConsecutivoCi {
  @PrimaryColumn({ name: 'CONSECUTIVO' })
  consecutivo: string

  @Column({ name: 'DESCRIPCION' })
  descripcion: string

  @Column({ name: 'MASCARA' })
  mascara: string

  @Column({ name: 'SIGUIENTE_CONSEC' })
  siguienteConsec: string
}
