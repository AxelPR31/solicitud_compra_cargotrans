import {
  InternalServerErrorException,
  MiddlewareConsumer,
  Module,
  Scope,
} from '@nestjs/common'
import '../load-env'
import { TenantController } from './tenant.controller'
import { TenantService } from './tenant.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Tenant } from './entities/tenant.entity'
import { DataSource } from 'typeorm'
import { REQUEST } from '@nestjs/core'
import { Centrocosto } from '../mantenimientos/centrocosto/entities/centrocosto.entity'
import { Cuentacontable } from '../mantenimientos/cuenta-contable/entities/cuenta-contable.entity'
import { UsuarioSoftland } from '../usuario-softland/entities/usuario-softland.entity'
import { CentroCuenta } from '../centro-cuenta/entities/centro-cuenta.entity'
import { Articulo } from '../articulo/entities/articulo.entity'
import { GlobalesCo } from '../globales-co/entities/globales-co.entity'
import { SolicitudOc } from '../solicitud-oc/entities/solicitud-oc.entity'
import { SolicitudOcLinea } from '../solicitud-oc-linea/entities/solicitud-oc-linea.entity'
import { Departamento } from '../departamento/entities/departamento.entity'
import { ArticuloCuenta } from '../articulo-cuenta/entities/articulo-cuenta.entity'

export const DATABASE_NAME =
  process.env.DATABASE_NAME?.trim() ||
  process.env.DATABASE_SCHEMA?.trim() ||
  'CEPENAD'
export const TENANT_CONENCTION = 'TENANT_CONNECTION'

const datasources: { [tenantId: string]: DataSource } = {}

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [TenantController],
  providers: [
    {
      provide: TENANT_CONENCTION,
      inject: [REQUEST, DataSource],
      scope: Scope.REQUEST,
      useFactory: async () => datasources['DEFAULT'],
    },
    TenantService,
  ],
  exports: [TENANT_CONENCTION],
})
export class TenantModule {
  constructor(private readonly connection: DataSource) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(async (req, res, next) => {
        try {
          let createdDatasource = datasources['DEFAULT']
          if (!createdDatasource) {
            createdDatasource = new DataSource({
              type: 'mssql',
              host: process.env.DATABASE_HOST ?? 'localhost',
              port:
                Number.parseInt(process.env.DATABASE_PORT ?? '1433', 10) ||
                1433,
              username: process.env.DATABASE_USER ?? '',
              password: process.env.DATABASE_PASSWORD ?? '',
              database:
                process.env.DATABASE_NAME?.trim() ||
                process.env.DATABASE_SCHEMA?.trim() ||
                'CEPENAD',
              schema:
                process.env.DATABASE_SCHEMA?.trim() ||
                process.env.DATABASE_NAME?.trim() ||
                'CEPENAD',
              entities: [
                Centrocosto,
                Cuentacontable,
                UsuarioSoftland,
                CentroCuenta,
                Articulo,
                GlobalesCo,
                SolicitudOc,
                SolicitudOcLinea,
                Departamento,
                ArticuloCuenta,
              ],
              synchronize: false,
              options: {
                encrypt:
                  (process.env.DATABASE_ENCRYPT ?? 'false').toLowerCase() ===
                    'true' ||
                  (process.env.DATABASE_ENCRYPT ?? 'false').toLowerCase() ===
                    '1',
              },
            })
            await createdDatasource.initialize()
            datasources['DEFAULT'] = createdDatasource
          }
          next()
        } catch (ex) {
          const message = ex instanceof Error ? ex.message : String(ex)
          console.error('Error conectando a la base de datos: ' + message)
          throw new InternalServerErrorException(ex)
        }
      })
      .exclude('tenant/(.*)')
      .forRoutes('*')
  }
}
