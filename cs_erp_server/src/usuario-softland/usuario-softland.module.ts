import { Module } from '@nestjs/common'
import { UsuarioSoftlandService } from './usuario-softland.service'
import { UsuarioSoftlandController } from './usuario-softland.controller'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [UsuarioSoftlandController],
  providers: [UsuarioSoftlandService],
})
export class UsuarioSoftlandModule {}
