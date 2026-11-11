import { Module, forwardRef } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtService } from '@nestjs/jwt'
import { TenantModule } from 'src/tenant/tenant.module'
import { SoftlandPasswordService } from './softland-password.service'
import { AuthGuard } from 'src/core/guards/auth.guard'
import { PermisoUsuarioModule } from '../permiso-usuario/permiso-usuario.module'

@Module({
  imports: [TenantModule, forwardRef(() => PermisoUsuarioModule)],
  controllers: [AuthController],
  providers: [AuthService, JwtService, SoftlandPasswordService, AuthGuard],
  exports: [JwtService, AuthGuard],
})
export class AuthModule {}
