import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TenantModule } from './tenant/tenant.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { CentrocostoModule } from './mantenimientos/centrocosto/centrocosto.module'
import { CuentacontableModule } from './mantenimientos/cuenta-contable/cuenta-contable.module'
import { ImpuestoModule } from './impuesto/impuesto.module'
import { TipoCambioHistModule } from './tipo-cambio-hist/tipo-cambio-hist.module'
import { ConfiguracionMonedaModule } from './configuracion-moneda/configuracion-moneda.module'
import { ConsecutivoModule } from './consecutivo/consecutivo.module'
import { PaisModule } from './pais/pais.module'
import { MovBancosModule } from './mov-bancos/mov-bancos.module'
import { CuentaBancariaModule } from './cuenta-bancaria/cuenta-bancaria.module'
import { UploadModuleModule } from './upload-module/upload-module.module'
import { MailModule } from './mail/mail.module'
import { AuthModule } from './auth/auth.module'
import { MonedaModule } from './moneda/moneda.module'
import { SubtipoDocCbModule } from './subtipo-doc-cb/subtipo-doc-cb.module'
import { DiarioModule } from './diario/diario.module'
import { AsientoDeDiarioModule } from './asiento-de-diario/asiento-de-diario.module'
import { UsuarioSoftlandModule } from './usuario-softland/usuario-softland.module'
import { RetencionesModule } from './retenciones/retenciones.module'
import { PaqueteModule } from './paquete/paquete.module'
import { ReportesModule } from './reportes/reportes.module'
import { AsientoMayorizadoModule } from './asiento-mayorizado/asiento-mayorizado.module'
import { MayorAuditoriaModule } from './mayor-auditoria/mayor-auditoria.module'
import { ConsultaOnlyReportesGuard } from './core/guards/consulta-only-reportes.guard'
import { ProveedorModule } from './proveedor/proveedor.module'
import { CentroCuentaModule } from './centro-cuenta/centro-cuenta.module'
import { DocumentoInvModule } from './documento-inv/documento-inv.module'
import { LineaDocInvModule } from './linea-doc-inv/linea-doc-inv.module'
import { PaqueteInventarioModule } from './paquete-inventario/paquete-inventario.module'
import { ConsecutivoCiModule } from './consecutivo-ci/consecutivo-ci.module'
import { AjusteConfigModule } from './ajuste-config/ajuste-config.module'
import { RecetaEncabezadoModule } from './receta-encabezado/receta-encabezado.module'
import { RecetaDetalleModule } from './receta-detalle/receta-detalle.module'
import { FactorValuacionModule } from './factor-valuacion/factor-valuacion.module'
import { OrdenProduccionVinculoModule } from './orden-produccion-vinculo/orden-produccion-vinculo.module'
import { ArticuloModule } from './articulo/articulo.module'
import { BodegaModule } from './bodega/bodega.module'
import { UnidadDeMedidaModule } from './unidad-de-medida/unidad-de-medida.module'
import { TrasladoInternoModule } from './traslado-interno/traslado-interno.module'
import { ExistenciaBodegaModule } from './existencia-bodega/existencia-bodega.module'
import { ConfiguracionDefectoModule } from './configuracion-defecto/configuracion-defecto.module'
import { ConsecutivoAppConsumoModule } from './consecutivo-app-consumo/consecutivo-app-consumo.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads/',
    }),
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: parseInt(process.env.DATABASE_PORT ?? '1433', 10),
      username: process.env.DATABASE_USER ?? '',
      password: process.env.DATABASE_PASSWORD ?? '',
      database:
        process.env.DATABASE_NAME ?? process.env.DATABASE_SCHEMA ?? 'CEPENAD',
      schema:
        process.env.DATABASE_SCHEMA ?? process.env.DATABASE_NAME ?? 'CEPENAD',
      options: { encrypt: false },
      synchronize: true,
      autoLoadEntities: true,
      connectionTimeout: 20000, // Establece el tiempo de espera para la conexión (20 segundos)
      requestTimeout: 20000,
    }),
    TenantModule,
    CentrocostoModule,
    CuentacontableModule,
    ImpuestoModule,
    TipoCambioHistModule,
    ConfiguracionMonedaModule,
    ConsecutivoModule,
    PaisModule,
    MovBancosModule,
    CuentaBancariaModule,
    UploadModuleModule,
    MailModule,
    AuthModule,
    MonedaModule,
    SubtipoDocCbModule,
    DiarioModule,
    AsientoDeDiarioModule,
    UsuarioSoftlandModule,
    RetencionesModule,

    PaqueteModule,

    ReportesModule,
    AsientoMayorizadoModule,
    MayorAuditoriaModule,
    ProveedorModule,

    CentroCuentaModule,
    DocumentoInvModule,
    LineaDocInvModule,
    PaqueteInventarioModule,
    ConsecutivoCiModule,
    AjusteConfigModule,
    RecetaEncabezadoModule,
    RecetaDetalleModule,
    FactorValuacionModule,
    OrdenProduccionVinculoModule,
    ArticuloModule,
    BodegaModule,
    UnidadDeMedidaModule,
    TrasladoInternoModule,
    ExistenciaBodegaModule,
    ConfiguracionDefectoModule,
    ConsecutivoAppConsumoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ConsultaOnlyReportesGuard },
  ],
})
export class AppModule {}
