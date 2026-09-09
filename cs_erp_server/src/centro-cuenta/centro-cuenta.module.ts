import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'
import { CentroCuentaController } from './centro-cuenta.controller'
import { CentroCuentaService } from './centro-cuenta.service'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [CentroCuentaController],
  providers: [CentroCuentaService],
  exports: [CentroCuentaService],
})
export class CentroCuentaModule {}

