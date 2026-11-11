import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'USUARIOS_APROB_OC', synchronize: false })
export class UsuarioAprobOc {
  @PrimaryColumn({ name: 'ORDEN_COMPRA' })
  ordenCompra: string

  @PrimaryColumn({ name: 'USUARIO' })
  usuario: string

  @Column({ name: 'FECHA_APROB', type: 'datetime' })
  fechaAprob: Date

  @Column({ name: 'CreatedBy' })
  createdBy: string

  @Column({ name: 'UpdatedBy' })
  updatedBy: string
}
