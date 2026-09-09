import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'CS_CONFIGURACION_DEFECTO', synchronize: true })
export class ConfiguracionDefecto {
  @PrimaryColumn({ name: 'TIPO' })
  tipo: string

  @Column({ name: 'CENTRO_COSTO', nullable: true })
  centroCosto: string

  @Column({ name: 'CUENTA_CONTABLE', nullable: true })
  cuentaContable: string
}
