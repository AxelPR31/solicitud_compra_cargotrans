import { Module } from '@nestjs/common'
import { UnidadDeMedidaService } from './unidad-de-medida.service'
import { UnidadDeMedidaController } from './unidad-de-medida.controller'
import { TenantModule } from '../tenant/tenant.module'

@Module({
  imports: [TenantModule],
  controllers: [UnidadDeMedidaController],
  providers: [UnidadDeMedidaService],
  exports: [UnidadDeMedidaService],
})
export class UnidadDeMedidaModule {}
