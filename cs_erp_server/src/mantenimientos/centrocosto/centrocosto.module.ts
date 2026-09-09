import { Module } from '@nestjs/common'
import { CentrocostoService } from './centrocosto.service'
import { CentrocostoController } from './centrocosto.controller'
import { TenantModule } from '../../tenant/tenant.module'
import { AuthModule } from '../../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [CentrocostoController],
  providers: [CentrocostoService],
})
export class CentrocostoModule {}
