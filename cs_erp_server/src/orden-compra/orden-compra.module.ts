import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { OrdenCompraService } from './orden-compra.service'
import { OrdenCompraController } from './orden-compra.controller'

@Module({
  imports: [TenantModule],
  controllers: [OrdenCompraController],
  providers: [OrdenCompraService],
})
export class OrdenCompraModule {}
