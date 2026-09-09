import { Module } from '@nestjs/common'
import { ConsecutivoService } from './consecutivo.service'
import { ConsecutivoController } from './consecutivo.controller'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [ConsecutivoController],
  providers: [ConsecutivoService],
  exports: [ConsecutivoService],
})
export class ConsecutivoModule {}
