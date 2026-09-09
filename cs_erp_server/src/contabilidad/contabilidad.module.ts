import { Module } from '@nestjs/common'
import { ContabilidadService } from './contabilidad.service'
import { TenantModule } from '../tenant/tenant.module'

@Module({
  imports: [TenantModule],
  controllers: [],
  providers: [ContabilidadService],
  exports: [ContabilidadService],
})
export class ContabilidadModule {}
