import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'TENANT', synchronize: true })
export class Tenant {
  @PrimaryGeneratedColumn('uuid', { name: 'TENANT' })
  tenant: string
  @Column({ name: 'NAME', unique: true })
  name: string
  @Column({ name: 'DATABASE_NAME' })
  databaseName: string
  @Column({ name: 'SCHEMA', default: 'ALINSA' })
  schema: string
  @Column({ name: 'HOST_NAME', default: 'localhost' })
  hostName: string
  // @Column()
  // availableUsers: string;
}
