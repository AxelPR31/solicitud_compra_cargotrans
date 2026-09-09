import { Module } from '@nestjs/common'
import { ExistenciaBodegaService } from './existencia-bodega.service'
import { ExistenciaBodegaController } from './existencia-bodega.controller'
import { TenantModule } from '../tenant/tenant.module'

@Module({
  imports: [TenantModule],
  controllers: [ExistenciaBodegaController],
  providers: [ExistenciaBodegaService],
  exports: [ExistenciaBodegaService],
})
export class ExistenciaBodegaModule {}
