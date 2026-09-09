import {
  BadRequestException,
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
import { Impuesto } from '../impuesto/entities/impuesto.entity'
import { ConfiguracionMoneda } from '../configuracion-moneda/entities/configuracion-moneda.entity'
import { TipoCambioHist } from '../tipo-cambio-hist/entities/tipo-cambio-hist.entity'
import { Consecutivo } from '../consecutivo/entities/consecutivo.entity'
import { Pai } from '../pais/entities/pai.entity'
import { MovBanco } from '../mov-bancos/entities/mov-banco.entity'
import { Moneda } from '../moneda/entities/moneda.entity'
import { SubtipoDocCb } from '../subtipo-doc-cb/entities/subtipo-doc-cb.entity'
import { Diario } from '../diario/entities/diario.entity'
import { AsientoDeDiario } from '../asiento-de-diario/entities/asiento-de-diario.entity'
import { UsuarioSoftland } from '../usuario-softland/entities/usuario-softland.entity'
import { Retencion } from '../retenciones/entities/retencion.entity'
import { Paquete } from '../paquete/entities/paquete.entity'
import { MayorAuditoria } from '../mayor-auditoria/entities/mayor-auditoria.entity'
import { AsientoMayorizado } from '../asiento-mayorizado/entities/asiento-mayorizado.entity'
import { CuentaBancaria } from '../cuenta-bancaria/entities/cuenta-bancaria.entity'
import { Proveedor } from '../proveedor/entities/proveedor.entity'
import { CentroCuenta } from '../centro-cuenta/entities/centro-cuenta.entity'
import { DocumentoInv } from '../documento-inv/entities/documento-inv.entity'
import { LineaDocInv } from '../linea-doc-inv/entities/linea-doc-inv.entity'
import { PaqueteInventario } from '../paquete-inventario/entities/paquete-inventario.entity'
import { ConsecutivoCi } from '../consecutivo-ci/entities/consecutivo-ci.entity'
import { AjusteConfig } from '../ajuste-config/entities/ajuste-config.entity'
import { RecetaEncabezado } from '../receta-encabezado/entities/receta-encabezado.entity'
import { RecetaMateriaPrima } from '../receta-encabezado/entities/receta-materia-prima.entity'
import { RecetaDetalle } from '../receta-detalle/entities/receta-detalle.entity'
import { FactorValuacion } from '../factor-valuacion/entities/factor-valuacion.entity'
import { OrdenProduccionVinculo } from '../orden-produccion-vinculo/entities/orden-produccion-vinculo.entity'
import { OrdenProduccionMateriaPrima } from '../orden-produccion-vinculo/entities/orden-produccion-materia-prima.entity'
import { OrdenProduccionDetalle } from '../orden-produccion-vinculo/entities/orden-produccion-detalle.entity'
import { Articulo } from '../articulo/entities/articulo.entity'
import { Bodega } from '../bodega/entities/bodega.entity'
import { UnidadDeMedida } from '../unidad-de-medida/entities/unidad-de-medida.entity'
import { TrasladoInternoEncabezado } from '../traslado-interno/entities/traslado-interno-encabezado.entity'
import { TrasladoInternoDetalle } from '../traslado-interno/entities/traslado-interno-detalle.entity'
import { ExistenciaBodega } from '../existencia-bodega/entities/existencia-bodega.entity'
import { ConfiguracionDefecto } from '../configuracion-defecto/entities/configuracion-defecto.entity'
import { ConsecutivoAppConsumo } from '../consecutivo-app-consumo/entities/consecutivo-app-consumo.entity'

/** Catálogo / schema para `EXEC` e inserts raw (mismo valor que en `.env`). */
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
      useFactory: async (request, datasource) => {
        // const tenant: Tenant = await datasource
        //   .getRepository(Tenant)
        //   .findOne({ where: { tenant: request.headers.tenant } })
        return datasources['DEFAULT']
      },
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
        // if (!req.headers.tenant) {
        //   throw new BadRequestException(
        //     'Bad Request Error',
        //     'Tenant Header Not Found',
        //   )
        // }

        // const tenant: Tenant = await this.connection
        //   .getRepository(Tenant)
        //   .findOne({ where: { tenant: req.headers.tenant } })
        /*TODO: Add validation for null tenant
          || tenant.tenant !== req.headers.tenant
        */
        // if (!tenant) {
        //   throw new BadRequestException(
        //     'DatabaseConnectionError',
        //     'Tenant Not Found',
        //   )
        // }

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
                Impuesto,
                ConfiguracionMoneda,
                TipoCambioHist,
                Consecutivo,
                Pai,
                CuentaBancaria,
                MovBanco,
                Moneda,
                SubtipoDocCb,
                Diario,
                AsientoDeDiario,
                UsuarioSoftland,
                Retencion,
                Paquete,
                MayorAuditoria,
                AsientoMayorizado,
                Proveedor,
                CentroCuenta,
                DocumentoInv,
                LineaDocInv,
                PaqueteInventario,
                ConsecutivoCi,
                AjusteConfig,
                RecetaEncabezado,
                RecetaMateriaPrima,
                RecetaDetalle,
                FactorValuacion,
                OrdenProduccionVinculo,
                OrdenProduccionMateriaPrima,
                OrdenProduccionDetalle,
                Articulo,
                Bodega,
                UnidadDeMedida,
                TrasladoInternoEncabezado,
                TrasladoInternoDetalle,
                ExistenciaBodega,
                ConfiguracionDefecto,
                ConsecutivoAppConsumo
              ],
              synchronize: true,
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
