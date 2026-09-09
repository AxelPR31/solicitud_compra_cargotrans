import { Module } from '@nestjs/common'
import { AsientoMayorizadoService } from './asiento-mayorizado.service'
import { AsientoMayorizadoController } from './asiento-mayorizado.controller'
import { TenantModule } from 'src/tenant/tenant.module'
import { AuthModule } from 'src/auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [AsientoMayorizadoController],
  providers: [AsientoMayorizadoService],
})
export class AsientoMayorizadoModule {}

