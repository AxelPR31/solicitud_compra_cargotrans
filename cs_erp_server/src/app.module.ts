import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TenantModule } from './tenant/tenant.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config'
import { CentrocostoModule } from './mantenimientos/centrocosto/centrocosto.module'
import { CuentacontableModule } from './mantenimientos/cuenta-contable/cuenta-contable.module'
import { AuthModule } from './auth/auth.module'
import { ArticuloModule } from './articulo/articulo.module'
import { CentroCuentaModule } from './centro-cuenta/centro-cuenta.module'
import { ConsultaOnlyReportesGuard } from './core/guards/consulta-only-reportes.guard'
import { GlobalesCoModule } from './globales-co/globales-co.module'
import { DepartamentoModule } from './departamento/departamento.module'
import { ArticuloCuentaModule } from './articulo-cuenta/articulo-cuenta.module'
import { SolicitudOcModule } from './solicitud-oc/solicitud-oc.module'
import { UsuarioSoftlandModule } from './usuario-softland/usuario-softland.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
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
      synchronize: false,
      autoLoadEntities: true,
      connectionTimeout: 20000,
      requestTimeout: 20000,
    }),
    TenantModule,
    CentrocostoModule,
    CuentacontableModule,
    AuthModule,
    ArticuloModule,
    CentroCuentaModule,
    GlobalesCoModule,
    DepartamentoModule,
    ArticuloCuentaModule,
    SolicitudOcModule,
    UsuarioSoftlandModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ConsultaOnlyReportesGuard },
  ],
})
export class AppModule {}
