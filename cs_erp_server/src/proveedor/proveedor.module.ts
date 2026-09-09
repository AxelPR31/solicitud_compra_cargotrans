import { Module } from '@nestjs/common'
import { ProveedorService } from './proveedor.service'
import { ProveedorController } from './proveedor.controller'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [ProveedorController],
  providers: [ProveedorService],
})
export class ProveedorModule {}
