import { Module, forwardRef } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'
import { PermisoUsuarioService } from './permiso-usuario.service'
import { PermisoUsuarioController } from './permiso-usuario.controller'

@Module({
  imports: [TenantModule, forwardRef(() => AuthModule)],
  controllers: [PermisoUsuarioController],
  providers: [PermisoUsuarioService],
  exports: [PermisoUsuarioService],
})
export class PermisoUsuarioModule {}
