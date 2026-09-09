import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ schema: 'CEPENAD', name: 'RETENCIONES', synchronize: false })
export class Retencion {
  @PrimaryColumn({ name: 'CODIGO_RETENCION' })
  codigoRetencion: string

  @Column({ name: 'DESCRIPCION' })
  descripcion: string

  @Column({ name: 'CTA_RETENCION' })
  cuentaRetencion: string

  @Column({ name: 'PORCENTAJE', type: 'decimal' })
  porcentaje: number
}
