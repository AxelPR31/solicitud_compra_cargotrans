import { Module } from '@nestjs/common'
import { AsientoDeDiarioService } from './asiento-de-diario.service'
import { AsientoDeDiarioController } from './asiento-de-diario.controller'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [AsientoDeDiarioController],
  providers: [AsientoDeDiarioService],
})
export class AsientoDeDiarioModule {}
