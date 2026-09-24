import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { UsuarioSoftlandController } from './usuario-softland.controller'
import { UsuarioSoftlandService } from './usuario-softland.service'

@Module({
  imports: [TenantModule],
  controllers: [UsuarioSoftlandController],
  providers: [UsuarioSoftlandService],
  exports: [UsuarioSoftlandService],
})
export class UsuarioSoftlandModule {}
