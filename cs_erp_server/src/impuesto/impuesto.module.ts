import { Module } from '@nestjs/common'
import { ImpuestoService } from './impuesto.service'
import { ImpuestoController } from './impuesto.controller'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [ImpuestoController],
  providers: [ImpuestoService],
})
export class ImpuestoModule {}
