import { Module } from '@nestjs/common'
import { BodegaService } from './bodega.service'
import { BodegaController } from './bodega.controller'
import { TenantModule } from '../tenant/tenant.module'

@Module({
  imports: [TenantModule],
  controllers: [BodegaController],
  providers: [BodegaService],
  exports: [BodegaService],
})
export class BodegaModule {}
