import { Module } from '@nestjs/common'
import { CuentaBancariaService } from './cuenta-bancaria.service'
import { CuentaBancariaController } from './cuenta-bancaria.controller'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [CuentaBancariaController],
  providers: [CuentaBancariaService],
  exports: [CuentaBancariaService],
})
export class CuentaBancariaModule {}
