import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'CS_ORDEN_PRODUCCION_VINCULO', synchronize: true })
export class OrdenProduccionVinculo {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'DOCUMENTO_CONSUMO', nullable: true })
  documentoConsumo: string

  @Column({ name: 'DOCUMENTO_ENTRADA', nullable: true })
  documentoEntrada: string

  @Column({ name: 'FECHA', type: 'datetime' })
  fecha: Date

  @Column({ name: 'TOTAL_LIBRAS', type: 'decimal', precision: 28, scale: 8 })
  totalLibras: number

  @Column({ name: 'TOTAL_COSTO', type: 'decimal', precision: 28, scale: 8 })
  totalCosto: number

  @Column({ name: 'MATERIA_PRIMA', nullable: true })
  materiaPrima: string

  @Column({ name: 'PESO_MATERIA_PRIMA', type: 'decimal', precision: 28, scale: 8, nullable: true })
  pesoMateriaPrima: number

  @Column({ name: 'COSTO_UNITARIO_MATERIA_PRIMA', type: 'decimal', precision: 28, scale: 8, nullable: true })
  costoUnitarioMateriaPrima: number

  @Column({ name: 'ELABORADO_BY', nullable: true })
  elaboradoPor: string

  @Column({ name: 'MERMA_LIBRAS', type: 'decimal', precision: 28, scale: 8, nullable: true })
  mermaLibras: number

  @Column({ name: 'MERMA_PORCENTAJE', type: 'decimal', precision: 28, scale: 8, nullable: true })
  mermaPorcentaje: number

  @Column({ name: 'NUMERO_DOCUMENTO', nullable: true })
  numeroDocumento: string

  @Column({ name: 'REFERENCIA', nullable: true })
  referencia: string
}

