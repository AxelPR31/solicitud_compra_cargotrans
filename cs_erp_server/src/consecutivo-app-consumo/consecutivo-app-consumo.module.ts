import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { ConsecutivoAppConsumoController } from './consecutivo-app-consumo.controller'
import { ConsecutivoAppConsumoService } from './consecutivo-app-consumo.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [ConsecutivoAppConsumoController],
  providers: [ConsecutivoAppConsumoService],
  exports: [ConsecutivoAppConsumoService],
})
export class ConsecutivoAppConsumoModule {}
