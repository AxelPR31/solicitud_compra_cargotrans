import { Module } from '@nestjs/common'
import { ConfiguracionDefectoService } from './configuracion-defecto.service'
import { ConfiguracionDefectoController } from './configuracion-defecto.controller'
import { TenantModule } from '../tenant/tenant.module'

@Module({
  imports: [TenantModule],
  controllers: [ConfiguracionDefectoController],
  providers: [ConfiguracionDefectoService],
  exports: [ConfiguracionDefectoService],
})
export class ConfiguracionDefectoModule {}
