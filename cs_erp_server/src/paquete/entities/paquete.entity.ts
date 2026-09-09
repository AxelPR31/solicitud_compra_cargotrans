import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'PAQUETE', synchronize: false })
export class Paquete {
  @PrimaryColumn({ name: 'PAQUETE' })
  paquete: string

  @Column({ name: 'DESCRIPCION' })
  descripcion: string

  @Column({ name: 'ULTIMO_ASIENTO' })
  ultimoAsiento: string
}
