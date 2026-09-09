import { Module } from '@nestjs/common'
import { CuentacontableService } from './cuenta-contable.service'
import { CuentacontableController } from './cuenta-contable.controller'
import { TenantModule } from '../../tenant/tenant.module'
import { AuthModule } from '../../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [CuentacontableController],
  providers: [CuentacontableService],
  exports: [CuentacontableService],
})
export class CuentacontableModule {}
