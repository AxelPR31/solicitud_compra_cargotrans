import { Module } from '@nestjs/common'
import { ConfiguracionMonedaService } from './configuracion-moneda.service'
import { ConfiguracionMonedaController } from './configuracion-moneda.controller'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [ConfiguracionMonedaController],
  providers: [ConfiguracionMonedaService],
})
export class ConfiguracionMonedaModule {}
