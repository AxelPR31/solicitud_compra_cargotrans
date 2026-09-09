import { Module } from '@nestjs/common'
import { TipoCambioHistService } from './tipo-cambio-hist.service'
import { TipoCambioHistController } from './tipo-cambio-hist.controller'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [TipoCambioHistController],
  providers: [TipoCambioHistService],
})
export class TipoCambioHistModule {}
