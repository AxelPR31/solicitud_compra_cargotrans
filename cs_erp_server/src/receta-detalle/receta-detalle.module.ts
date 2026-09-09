import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { RecetaDetalleController } from './receta-detalle.controller'
import { RecetaDetalleService } from './receta-detalle.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [RecetaDetalleController],
  providers: [RecetaDetalleService],
})
export class RecetaDetalleModule {}
