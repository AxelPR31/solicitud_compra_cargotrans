import { DataSource, Repository } from 'typeorm'
import { Producto } from '../src/producto/entities/producto.entity'
import { Tenant } from '../src/tenant/entities/tenant.entity'

export class testConnection {
  private static _instance: testConnection

  constructor() {}
  public static get instance(): testConnection {
    if (!this._instance) this._instance = new testConnection()
    return this._instance
  }

  private _datasource: DataSource
  public get datasource(): DataSource {
    if (!this._datasource)
      this._datasource = new DataSource({
        type: 'mssql',
        host: '3.145.115.55',
        port: 1433,
        database: 'CS_ERP',
        username: 'Corpsoft1',
        password: 'Softland1.*',
        entities: [Producto],
        synchronize: true,
        options: {
          encrypt: false,
        },
      })
    return this._datasource
  }

  private _tenantDatasource: DataSource
  public get tenantDatasource(): DataSource {
    if (!this._datasource)
      this._datasource = new DataSource({
        type: 'mssql',
        host: 'localhost',
        port: 1433,
        username: 'sa',
        password: '123',
        database: 'BOLCOMER',
        options: { encrypt: false },
        synchronize: false,
        entities: [Tenant],
      })
    return this._datasource
  }
}
