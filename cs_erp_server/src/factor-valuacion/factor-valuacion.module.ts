import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { FactorValuacionController } from './factor-valuacion.controller'
import { FactorValuacionService } from './factor-valuacion.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [FactorValuacionController],
  providers: [FactorValuacionService],
})
export class FactorValuacionModule {}
