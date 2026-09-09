import { Module } from '@nestjs/common'
import { RetencionesService } from './retenciones.service'
import { RetencionesController } from './retenciones.controller'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [RetencionesController],
  providers: [RetencionesService],
})
export class RetencionesModule {}
