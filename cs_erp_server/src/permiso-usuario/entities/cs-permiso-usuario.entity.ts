import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'CS_PERMISO_USUARIO', synchronize: false })
export class CsPermisoUsuario {
  @PrimaryColumn({ name: 'USUARIO', length: 25 })
  usuario: string

  @PrimaryColumn({ name: 'PERMISO', length: 40 })
  permiso: string

  @Column({ name: 'ACTIVO', type: 'bit' })
  activo: boolean

  @Column({ name: 'CreateDate', type: 'datetime' })
  createDate: Date
}
