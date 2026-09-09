import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { PaqueteInventarioController } from './paquete-inventario.controller'
import { PaqueteInventarioService } from './paquete-inventario.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [PaqueteInventarioController],
  providers: [PaqueteInventarioService],
})
export class PaqueteInventarioModule {}
