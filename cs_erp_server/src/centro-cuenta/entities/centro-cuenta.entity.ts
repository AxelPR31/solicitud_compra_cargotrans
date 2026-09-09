import { Column, Entity, PrimaryColumn } from 'typeorm'

const DB_SCHEMA =
  process.env.DATABASE_SCHEMA ?? process.env.DATABASE_NAME ?? 'CEPENAD'

@Entity({ schema: DB_SCHEMA, name: 'CENTRO_CUENTA', synchronize: false })
export class CentroCuenta {
  @PrimaryColumn({ type: 'varchar', name: 'CENTRO_COSTO' })
  centroCosto: string

  @PrimaryColumn({ type: 'varchar', name: 'CUENTA_CONTABLE' })
  cuentaContable: string

  @Column({ type: 'varchar', name: 'ESTADO' })
  estado: string
}

