import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { AjusteConfigController } from './ajuste-config.controller'
import { AjusteConfigService } from './ajuste-config.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [AjusteConfigController],
  providers: [AjusteConfigService],
})
export class AjusteConfigModule {}
