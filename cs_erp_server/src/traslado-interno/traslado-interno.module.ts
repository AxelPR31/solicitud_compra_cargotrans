import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { TrasladoInternoController } from './traslado-interno.controller'
import { TrasladoInternoService } from './traslado-interno.service'
import { ConsecutivoCiModule } from '../consecutivo-ci/consecutivo-ci.module'
import { AuthModule } from '../auth/auth.module'
import { ConsecutivoAppConsumoModule } from '../consecutivo-app-consumo/consecutivo-app-consumo.module'

@Module({
  imports: [TenantModule, AuthModule, ConsecutivoCiModule, ConsecutivoAppConsumoModule],
  controllers: [TrasladoInternoController],
  providers: [TrasladoInternoService],
})
export class TrasladoInternoModule {}
