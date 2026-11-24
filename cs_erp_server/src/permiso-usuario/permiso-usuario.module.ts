import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { UsuarioSoftland } from '../usuario-softland/entities/usuario-softland.entity'
import { CsPermisoUsuario } from './entities/cs-permiso-usuario.entity'
import { PermisoUsuarioService } from './permiso-usuario.service'
import { PermisoUsuarioController } from './permiso-usuario.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([CsPermisoUsuario, UsuarioSoftland]),
    forwardRef(() => AuthModule),
  ],
  controllers: [PermisoUsuarioController],
  providers: [PermisoUsuarioService],
  exports: [PermisoUsuarioService],
})
export class PermisoUsuarioModule {}
