import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { OrdenProduccionVinculoController } from './orden-produccion-vinculo.controller'
import { OrdenProduccionVinculoService } from './orden-produccion-vinculo.service'
import { AuthModule } from '../auth/auth.module'
import { ConsecutivoAppConsumoModule } from '../consecutivo-app-consumo/consecutivo-app-consumo.module'

@Module({
  imports: [TenantModule, AuthModule, ConsecutivoAppConsumoModule],
  controllers: [OrdenProduccionVinculoController],
  providers: [OrdenProduccionVinculoService],
})
export class OrdenProduccionVinculoModule {}
