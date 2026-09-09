import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { ReportesController } from './reportes.controller'
import { ReportesService } from './reportes.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
