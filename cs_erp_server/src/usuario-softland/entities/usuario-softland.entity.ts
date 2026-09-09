import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ schema: 'ERPADMIN', name: 'USUARIO', synchronize: false })
export class UsuarioSoftland {
  @PrimaryColumn({ name: 'USUARIO' })
  usuario: string

  @Column({ name: 'NOMBRE' })
  nombre: string

  @Column({ name: 'CLAVE' })
  clave: string
}
